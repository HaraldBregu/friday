export const CODER_PROVIDER_IDS = ['openai-codex', 'openai', 'anthropic'] as const;
export const CODER_THINKING_LEVELS = [
	'off',
	'minimal',
	'low',
	'medium',
	'high',
	'xhigh',
	'max',
] as const;
export const CODER_TOOL_MODES = ['read-only', 'coding'] as const;

export type CoderProviderId = (typeof CODER_PROVIDER_IDS)[number];
export type CoderThinkingLevel = (typeof CODER_THINKING_LEVELS)[number];
export type CoderToolMode = (typeof CODER_TOOL_MODES)[number];
export type CoderRunMode = 'agent' | 'shell';

export interface CoderSettings {
	readonly runtime: 'pi';
	readonly providerId: CoderProviderId;
	readonly modelId: string;
	readonly thinkingLevel: CoderThinkingLevel;
	readonly toolMode: CoderToolMode;
	readonly workingDirectory: string;
}

export interface CoderModel {
	readonly id: string;
	readonly name: string;
	readonly reasoning: boolean;
	readonly contextWindow: number;
}

export interface CoderProvider {
	readonly id: CoderProviderId;
	readonly name: string;
	readonly authentication: 'oauth' | 'api-key';
	readonly configured: boolean;
	readonly authType?: 'oauth' | 'api_key';
	readonly authSource?: string;
	readonly models: readonly CoderModel[];
}

export interface CoderCatalog {
	readonly providers: readonly CoderProvider[];
}

export interface CoderProject {
	readonly id: string;
	readonly name: string;
	readonly directory: string;
	readonly kind: 'agent-workspace' | 'external';
	readonly createdAt: string;
	readonly lastOpenedAt: string;
	readonly available: boolean;
}

export interface CoderSessionSummary {
	readonly id: string;
	readonly projectId: string;
	readonly title: string;
	readonly createdAt: string;
	readonly updatedAt: string;
	readonly messageCount: number;
}

export type CoderSessionBlock =
	| {
			readonly id: string;
			readonly type: 'message';
			readonly role: 'user' | 'assistant';
			readonly content: string;
			readonly timestamp: string;
	  }
	| {
			readonly id: string;
			readonly type: 'command';
			readonly command: string;
			readonly output: string;
			readonly status: 'succeeded' | 'failed' | 'cancelled';
			readonly exitCode?: number;
			readonly truncated: boolean;
			readonly timestamp: string;
	  };

export interface CoderSessionSnapshot {
	readonly session: CoderSessionSummary;
	readonly blocks: readonly CoderSessionBlock[];
}

export interface CoderRunRequest {
	readonly projectId: string;
	readonly sessionId?: string;
	readonly mode: CoderRunMode;
	readonly input: string;
}

export interface CoderRunResult {
	readonly projectId: string;
	readonly sessionId: string;
	readonly output: string;
}

interface CoderResponseEventBase {
	readonly runId: string;
	readonly projectId: string;
	readonly sessionId: string;
}

export type CoderResponseEvent =
	| (CoderResponseEventBase & {
			readonly type: 'status';
			readonly status: 'started' | 'completed' | 'cancelled';
	  })
	| (CoderResponseEventBase & { readonly type: 'text-delta'; readonly delta: string })
	| (CoderResponseEventBase & { readonly type: 'thinking-delta'; readonly delta: string })
	| (CoderResponseEventBase & {
			readonly type: 'tool-start';
			readonly toolCallId: string;
			readonly toolName: string;
	  })
	| (CoderResponseEventBase & {
			readonly type: 'tool-end';
			readonly toolCallId: string;
			readonly toolName: string;
			readonly isError: boolean;
	  })
	| (CoderResponseEventBase & {
			readonly type: 'command-start';
			readonly command: string;
	  })
	| (CoderResponseEventBase & { readonly type: 'command-output'; readonly delta: string })
	| (CoderResponseEventBase & {
			readonly type: 'command-end';
			readonly exitCode?: number;
			readonly cancelled: boolean;
			readonly truncated: boolean;
	  })
	| (CoderResponseEventBase & { readonly type: 'error'; readonly message: string });

export type CoderAuthEvent =
	| { readonly type: 'progress'; readonly message: string }
	| { readonly type: 'info'; readonly message: string; readonly url?: string }
	| { readonly type: 'auth-url'; readonly url: string; readonly instructions?: string }
	| {
			readonly type: 'device-code';
			readonly userCode: string;
			readonly verificationUri: string;
			readonly expiresInSeconds?: number;
	  };

export interface CoderAuthStatus {
	readonly configured: boolean;
	readonly type?: 'oauth' | 'api_key';
	readonly source?: string;
}

export function isCoderSettings(value: unknown): value is CoderSettings {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const settings = value as Partial<CoderSettings>;
	return (
		settings.runtime === 'pi' &&
		typeof settings.providerId === 'string' &&
		CODER_PROVIDER_IDS.includes(settings.providerId as CoderProviderId) &&
		typeof settings.modelId === 'string' &&
		typeof settings.thinkingLevel === 'string' &&
		CODER_THINKING_LEVELS.includes(settings.thinkingLevel as CoderThinkingLevel) &&
		typeof settings.toolMode === 'string' &&
		CODER_TOOL_MODES.includes(settings.toolMode as CoderToolMode) &&
		typeof settings.workingDirectory === 'string' &&
		settings.workingDirectory.trim().length > 0
	);
}

export function isCoderRunRequest(value: unknown): value is CoderRunRequest {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const request = value as Partial<CoderRunRequest>;
	return (
		typeof request.projectId === 'string' &&
		request.projectId.trim().length > 0 &&
		(request.sessionId === undefined ||
			(typeof request.sessionId === 'string' && request.sessionId.trim().length > 0)) &&
		(request.mode === 'agent' || request.mode === 'shell') &&
		typeof request.input === 'string' &&
		request.input.trim().length > 0
	);
}
