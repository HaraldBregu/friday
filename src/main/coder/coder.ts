import { mkdirSync } from 'node:fs';
import path from 'node:path';
import {
	createAgentSession,
	DefaultResourceLoader,
	ModelRuntime,
	SessionManager,
	SettingsManager,
	type AgentSessionEvent,
	type SessionInfo,
} from '@earendil-works/pi-coding-agent';
import type { StoredProvider } from '../../shared/provider_types';
import type {
	CoderAuthEvent,
	CoderAuthStatus,
	CoderCatalog,
	CoderProject,
	CoderProvider,
	CoderProviderId,
	CoderResponseEvent,
	CoderRunRequest,
	CoderRunResult,
	CoderSessionBlock,
	CoderSessionSnapshot,
	CoderSessionSummary,
	CoderSettings,
} from '../../shared/coder_types';
import { coderLocation, coderSessionsLocation } from './location';
import { CoderProjectStore } from './projects';
import { CoderStore } from './store';

const SUPPORTED_PROVIDERS: readonly CoderProviderId[] = ['openai-codex', 'openai', 'anthropic'];
const READ_ONLY_TOOLS = ['read', 'grep', 'find', 'ls'];
const CODING_TOOLS = ['read', 'bash', 'edit', 'write', 'grep', 'find', 'ls'];
const RUN_TIMEOUT_MS = 30 * 60 * 1000;
const AUTH_TIMEOUT_MS = 10 * 60 * 1000;

interface ActiveRun {
	readonly ownerId: number;
	readonly projectId: string;
	readonly sessionId: string;
	readonly sessionKey: string;
	readonly controller: AbortController;
	abortSession?: () => Promise<void>;
}

interface CoderDependencies {
	readonly store: CoderStore;
	readonly projects: CoderProjectStore;
	readonly getProvider: (providerId: string) => StoredProvider | undefined;
}

export class Coder {
	private readonly runs = new Map<string, ActiveRun>();
	private readonly authControllers = new Map<number, AbortController>();
	private runtimePromise?: Promise<ModelRuntime>;

	constructor(private readonly dependencies: CoderDependencies) {
		mkdirSync(coderLocation(), { recursive: true });
		mkdirSync(coderSessionsLocation(), { recursive: true });
	}

	getSettings(): CoderSettings {
		return this.dependencies.store.get();
	}

	saveSettings(settings: CoderSettings): CoderSettings {
		return this.dependencies.store.set(settings);
	}

	listProjects(): CoderProject[] {
		return this.dependencies.projects.list();
	}

	addProject(directory: string): CoderProject {
		return this.dependencies.projects.add(directory);
	}

	removeProject(projectId: string): boolean {
		if ([...this.runs.values()].some((run) => run.projectId === projectId)) {
			throw new Error('Stop the active project run before removing it from Coder.');
		}
		return this.dependencies.projects.remove(projectId);
	}

	async listSessions(projectId: string): Promise<CoderSessionSummary[]> {
		const project = this.requireProject(projectId);
		const sessions = await SessionManager.list(project.directory, coderSessionsLocation());
		return sessions.map((session) => this.sessionSummary(project.id, session));
	}

	async getSession(projectId: string, sessionId: string): Promise<CoderSessionSnapshot> {
		const project = this.requireProject(projectId);
		const sessionInfo = await this.requireSession(project, sessionId);
		const manager = SessionManager.open(
			sessionInfo.path,
			coderSessionsLocation(),
			project.directory
		);
		const blocks = manager
			.buildSessionContext()
			.messages.map((message, index) => this.sessionBlock(message, index))
			.filter((block): block is CoderSessionBlock => Boolean(block));
		this.dependencies.projects.touch(project.id);
		return { session: this.sessionSummary(project.id, sessionInfo), blocks };
	}

	async listModels(): Promise<CoderCatalog> {
		const runtime = await this.getRuntime();
		await this.syncApiKeys(runtime);
		const providers = await Promise.all(
			runtime
				.getProviders()
				.filter((provider) => SUPPORTED_PROVIDERS.includes(provider.id as CoderProviderId))
				.map(async (provider): Promise<CoderProvider> => {
					const id = provider.id as CoderProviderId;
					const auth = await runtime.checkAuth(id);
					return {
						id,
						name: provider.name,
						authentication: id === 'openai-codex' ? 'oauth' : 'api-key',
						configured: Boolean(auth),
						...(auth?.type ? { authType: auth.type } : {}),
						...(auth?.source ? { authSource: auth.source } : {}),
						models: runtime.getModels(id).map((model) => ({
							id: model.id,
							name: model.name,
							reasoning: model.reasoning,
							contextWindow: model.contextWindow,
						})),
					};
				})
		);
		return { providers };
	}

	async connectCodex(
		windowId: number,
		emit: (event: CoderAuthEvent) => void
	): Promise<CoderAuthStatus> {
		if (this.authControllers.has(windowId))
			throw new Error('A Codex login is already in progress.');
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
		this.authControllers.set(windowId, controller);
		try {
			const runtime = await this.getRuntime();
			await runtime.login('openai-codex', 'oauth', {
				signal: controller.signal,
				prompt: async (prompt) => {
					if (prompt.type !== 'select') {
						throw new Error('The Codex device login requested unsupported user input.');
					}
					const deviceOption = prompt.options.find((option) => option.id === 'device_code');
					if (!deviceOption) throw new Error('Codex device login is unavailable.');
					return deviceOption.id;
				},
				notify: (event) => {
					if (event.type === 'device_code') {
						emit({
							type: 'device-code',
							userCode: event.userCode,
							verificationUri: event.verificationUri,
							...(event.expiresInSeconds ? { expiresInSeconds: event.expiresInSeconds } : {}),
						});
					} else if (event.type === 'auth_url') {
						emit({
							type: 'auth-url',
							url: event.url,
							...(event.instructions ? { instructions: event.instructions } : {}),
						});
					} else if (event.type === 'info') {
						emit({
							type: 'info',
							message: event.message,
							...(event.links?.[0]?.url ? { url: event.links[0].url } : {}),
						});
					} else {
						emit({ type: 'progress', message: event.message });
					}
				},
			});
			const auth = await runtime.checkAuth('openai-codex');
			return {
				configured: Boolean(auth),
				...(auth?.type ? { type: auth.type } : {}),
				...(auth?.source ? { source: auth.source } : {}),
			};
		} finally {
			clearTimeout(timeout);
			this.authControllers.delete(windowId);
		}
	}

	cancelCodexLogin(windowId: number): boolean {
		const controller = this.authControllers.get(windowId);
		if (!controller) return false;
		controller.abort();
		return true;
	}

	async disconnectCodex(): Promise<void> {
		const runtime = await this.getRuntime();
		await runtime.logout('openai-codex');
	}

	async send(
		windowId: number,
		runId: string,
		prompt: string,
		emit: (event: CoderResponseEvent) => void
	): Promise<string> {
		if (this.runs.has(runId)) throw new Error('Coder run id is already active.');
		const controller = new AbortController();
		const run: ActiveRun = { windowId, controller };
		this.runs.set(runId, run);
		emit({ type: 'status', runId, status: 'started' });
		const timeout = setTimeout(() => controller.abort(), RUN_TIMEOUT_MS);
		try {
			const settings = this.getSettings();
			const cwd = path.resolve(settings.workingDirectory);
			if (!existsSync(cwd) || !statSync(cwd).isDirectory()) {
				throw new Error('The configured coder working directory is unavailable.');
			}
			const runtime = await this.getRuntime();
			await this.syncApiKeys(runtime);
			const model = runtime.getModel(settings.providerId, settings.modelId);
			if (!model) throw new Error('Select an available Pi model in Coder settings.');
			if (!(await runtime.checkAuth(settings.providerId))) {
				throw new Error(`Connect ${settings.providerId} before starting a coder run.`);
			}
			const settingsManager = SettingsManager.inMemory(
				{
					defaultProvider: settings.providerId,
					defaultModel: settings.modelId,
					defaultThinkingLevel: settings.thinkingLevel,
					enableAnalytics: false,
					enableInstallTelemetry: false,
				},
				{ projectTrusted: true }
			);
			const resourceLoader = new DefaultResourceLoader({
				cwd,
				agentDir: coderLocation(),
				settingsManager,
				noExtensions: true,
				noSkills: true,
				noPromptTemplates: true,
				noThemes: true,
			});
			await resourceLoader.reload();
			const { session } = await createAgentSession({
				cwd,
				agentDir: coderLocation(),
				modelRuntime: runtime,
				model,
				thinkingLevel: settings.thinkingLevel,
				tools: settings.toolMode === 'coding' ? CODING_TOOLS : READ_ONLY_TOOLS,
				resourceLoader,
				sessionManager: SessionManager.inMemory(cwd),
				settingsManager,
			});
			run.abortSession = () => session.abort();
			let output = '';
			let finalError: string | undefined;
			const unsubscribe = session.subscribe((event: AgentSessionEvent) => {
				if (event.type === 'message_update') {
					const update = event.assistantMessageEvent;
					if (update.type === 'text_delta') {
						output += update.delta;
						emit({ type: 'text-delta', runId, delta: update.delta });
					} else if (update.type === 'thinking_delta') {
						emit({ type: 'thinking-delta', runId, delta: update.delta });
					} else if (update.type === 'error') {
						finalError = update.error.errorMessage || 'Pi stopped with an error.';
					}
				} else if (event.type === 'tool_execution_start') {
					emit({
						type: 'tool-start',
						runId,
						toolCallId: event.toolCallId,
						toolName: event.toolName,
					});
				} else if (event.type === 'tool_execution_end') {
					emit({
						type: 'tool-end',
						runId,
						toolCallId: event.toolCallId,
						toolName: event.toolName,
						isError: event.isError,
					});
				}
			});
			const abortSession = (): void => {
				void session.abort();
			};
			controller.signal.addEventListener('abort', abortSession, { once: true });
			try {
				if (controller.signal.aborted) await session.abort();
				else await session.prompt(prompt, { expandPromptTemplates: false, source: 'rpc' });
				if (controller.signal.aborted) throw new Error('Coder run cancelled.');
				if (finalError) throw new Error(finalError);
				emit({ type: 'status', runId, status: 'completed' });
				return output;
			} finally {
				controller.signal.removeEventListener('abort', abortSession);
				unsubscribe();
				session.dispose();
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Coder run failed.';
			if (controller.signal.aborted) emit({ type: 'status', runId, status: 'cancelled' });
			else emit({ type: 'error', runId, message });
			throw error;
		} finally {
			clearTimeout(timeout);
			this.runs.delete(runId);
		}
	}

	cancel(runId: string, windowId: number): boolean {
		const run = this.runs.get(runId);
		if (!run || run.windowId !== windowId) return false;
		run.controller.abort();
		void run.abortSession?.();
		return true;
	}

	cancelWindow(windowId: number): void {
		for (const [runId, run] of this.runs) {
			if (run.windowId === windowId) this.cancel(runId, windowId);
		}
		this.cancelCodexLogin(windowId);
	}

	destroy(): void {
		for (const run of this.runs.values()) {
			run.controller.abort();
			void run.abortSession?.();
		}
		for (const controller of this.authControllers.values()) controller.abort();
		this.runs.clear();
		this.authControllers.clear();
	}

	private getRuntime(): Promise<ModelRuntime> {
		this.runtimePromise ??= ModelRuntime.create({
			authPath: path.join(coderLocation(), 'auth.json'),
			modelsPath: null,
			allowModelNetwork: false,
		});
		return this.runtimePromise;
	}

	private async syncApiKeys(runtime: ModelRuntime): Promise<void> {
		for (const providerId of ['openai', 'anthropic'] as const) {
			const apiKey = this.dependencies.getProvider(providerId)?.apiKey.trim();
			if (apiKey) await runtime.setRuntimeApiKey(providerId, apiKey);
			else await runtime.removeRuntimeApiKey(providerId);
		}
	}
}
