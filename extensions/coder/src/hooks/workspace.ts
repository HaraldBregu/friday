import { useCallback, useEffect, useRef, useState } from 'react';
import {
	app,
	coder as coderApi,
	isFriday,
	type CoderProject,
	type CoderResponseEvent,
	type CoderRunMode,
	type CoderSessionBlock,
	type CoderSessionSummary,
	type CoderSettings,
} from '@friday/sdk';

import type { CoderBlock, CoderController, RunState } from '@/controller';

const ACTIVE_PROJECT_KEY = 'active-project-id';
const previewTimestamp = new Date().toISOString();
const previewSettings: CoderSettings = {
	runtime: 'pi',
	providerId: 'openai-codex',
	modelId: 'gpt-5.4',
	thinkingLevel: 'high',
	toolMode: 'coding',
};
const previewProjects: CoderProject[] = [
	{
		id: 'friday',
		name: 'friday',
		directory: '/workspace/friday',
		kind: 'agent-workspace',
		createdAt: previewTimestamp,
		lastOpenedAt: previewTimestamp,
		available: true,
	},
	{
		id: 'website',
		name: 'website',
		directory: '/Users/demo/Projects/website',
		kind: 'external',
		createdAt: previewTimestamp,
		lastOpenedAt: previewTimestamp,
		available: true,
	},
];
const previewSessions: CoderSessionSummary[] = [
	{
		id: 'session-1',
		projectId: 'friday',
		title: 'Remember recent commands',
		createdAt: previewTimestamp,
		updatedAt: previewTimestamp,
		messageCount: 5,
	},
];
const previewBlocks: CoderBlock[] = [
	{
		id: 'preview-user',
		type: 'message',
		role: 'user',
		content: 'Make the command palette remember the most recently used actions.',
		status: 'complete',
		timestamp: previewTimestamp,
	},
	{
		id: 'preview-tool',
		type: 'tool',
		toolName: 'read',
		status: 'succeeded',
		timestamp: previewTimestamp,
	},
	{
		id: 'preview-assistant',
		type: 'message',
		role: 'assistant',
		content:
			'I kept the change local to the command context and restored recent actions on launch.\n\nThe focused renderer tests pass.',
		status: 'complete',
		timestamp: previewTimestamp,
	},
];

export function useCoderWorkspace(): CoderController {
	const preview = !isFriday();
	const activeRunIdRef = useRef('');
	const cancelRequestedRef = useRef(false);
	const runningRef = useRef(false);
	const loadSequenceRef = useRef(0);
	const [settings, setSettings] = useState<CoderSettings>(preview ? previewSettings : previewSettings);
	const [projects, setProjects] = useState<CoderProject[]>(preview ? previewProjects : []);
	const [sessions, setSessions] = useState<CoderSessionSummary[]>(
		preview ? previewSessions : []
	);
	const [blocks, setBlocks] = useState<CoderBlock[]>(preview ? previewBlocks : []);
	const [activeProjectId, setActiveProjectId] = useState<string | undefined>(
		preview ? 'friday' : undefined
	);
	const [activeSessionId, setActiveSessionId] = useState<string | undefined>(
		preview ? 'session-1' : undefined
	);
	const [input, setInput] = useState('');
	const [mode, setMode] = useState<CoderRunMode>('agent');
	const [query, setQuery] = useState('');
	const [runState, setRunState] = useState<RunState>(preview ? 'idle' : 'loading');
	const [runLabel, setRunLabel] = useState(preview ? 'Preview' : 'Loading');
	const [error, setError] = useState('');
	const [leftOpen, setLeftOpen] = useState(true);
	const [busy, setBusy] = useState(!preview);

	const loadProject = useCallback(
		async (projectId: string, preferredSessionId?: string): Promise<void> => {
			if (preview) {
				setActiveProjectId(projectId);
				setSessions(projectId === 'friday' ? previewSessions : []);
				setActiveSessionId(projectId === 'friday' ? 'session-1' : undefined);
				setBlocks(projectId === 'friday' ? previewBlocks : []);
				return;
			}
			const sequence = ++loadSequenceRef.current;
			setBusy(true);
			setError('');
			setActiveProjectId(projectId);
			try {
				const nextSessions = await coderApi.listSessions(projectId);
				if (sequence !== loadSequenceRef.current) return;
				setSessions(nextSessions);
				const session =
					nextSessions.find((item) => item.id === preferredSessionId) ?? nextSessions[0];
				if (!session) {
					setActiveSessionId(undefined);
					setBlocks([]);
					return;
				}
				const snapshot = await coderApi.getSession(projectId, session.id);
				if (sequence !== loadSequenceRef.current) return;
				setActiveSessionId(session.id);
				setBlocks(
					snapshot.blocks.map((block: CoderSessionBlock): CoderBlock =>
						block.type === 'message'
							? { ...block, status: 'complete' }
							: block
					)
				);
			} catch (reason) {
				if (sequence !== loadSequenceRef.current) return;
				setError(reason instanceof Error ? reason.message : 'Unable to open this project.');
				setSessions([]);
				setActiveSessionId(undefined);
				setBlocks([]);
			} finally {
				if (sequence === loadSequenceRef.current) setBusy(false);
			}
		},
		[preview]
	);

	useEffect(() => {
		if (preview) return;
		let active = true;
		void Promise.all([
			coderApi.getSettings(),
			coderApi.listProjects(),
			app.getExtensionStoreValue<string>(ACTIVE_PROJECT_KEY),
		])
			.then(async ([nextSettings, nextProjects, savedProjectId]) => {
				if (!active) return;
				setSettings(nextSettings);
				setProjects(nextProjects);
				const project =
					nextProjects.find((item) => item.id === savedProjectId) ?? nextProjects[0];
				if (!project) {
					setRunLabel(nextSettings.modelId ? 'Open a project' : 'Setup needed');
					setRunState('idle');
					setBusy(false);
					return;
				}
				await loadProject(project.id);
				if (!active) return;
				setRunLabel(nextSettings.modelId ? 'Ready' : 'Setup needed');
				setRunState('idle');
			})
			.catch((reason) => {
				if (!active) return;
				setError(reason instanceof Error ? reason.message : 'Unable to load Coder.');
				setRunState('error');
				setRunLabel('Unavailable');
				setBusy(false);
			});
		return () => {
			active = false;
		};
	}, [loadProject, preview]);

	const newSession = useCallback(() => {
		if (runningRef.current || !activeProjectId) return;
		setActiveSessionId(undefined);
		setBlocks([]);
		setError('');
		setRunState('idle');
		setRunLabel(settings.modelId ? 'Ready' : 'Setup needed');
		window.requestAnimationFrame(() =>
			document.querySelector<HTMLTextAreaElement>('#coder-composer')?.focus()
		);
	}, [activeProjectId, settings.modelId]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const command = event.metaKey || event.ctrlKey;
			if (command && event.key.toLowerCase() === 'n' && !runningRef.current) {
				event.preventDefault();
				newSession();
			}
			if (command && event.key === '/') {
				event.preventDefault();
				document.querySelector<HTMLTextAreaElement>('#coder-composer')?.focus();
			}
			if (event.key === 'Escape' && leftOpen && window.innerWidth < 760) setLeftOpen(false);
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [leftOpen, newSession]);

	const selectProject = useCallback(
		async (projectId: string): Promise<void> => {
			if (runningRef.current || projectId === activeProjectId) return;
			await loadProject(projectId);
			if (!preview) await app.setExtensionStoreValue(ACTIVE_PROJECT_KEY, projectId);
			if (window.innerWidth < 760) setLeftOpen(false);
		},
		[activeProjectId, loadProject, preview]
	);

	const selectSession = useCallback(
		async (sessionId: string): Promise<void> => {
			if (runningRef.current || !activeProjectId || sessionId === activeSessionId) return;
			setBusy(true);
			setError('');
			try {
				if (preview) {
					setActiveSessionId(sessionId);
					setBlocks(previewBlocks);
				} else {
					const snapshot = await coderApi.getSession(activeProjectId, sessionId);
					setActiveSessionId(sessionId);
					setBlocks(
						snapshot.blocks.map((block: CoderSessionBlock): CoderBlock =>
							block.type === 'message'
								? { ...block, status: 'complete' }
								: block
						)
					);
				}
				if (window.innerWidth < 760) setLeftOpen(false);
			} catch (reason) {
				setError(reason instanceof Error ? reason.message : 'Unable to open this session.');
			} finally {
				setBusy(false);
			}
		},
		[activeProjectId, activeSessionId, preview]
	);

	const addProject = useCallback(async (): Promise<void> => {
		if (runningRef.current || preview) return;
		setBusy(true);
		setError('');
		try {
			const project = await coderApi.addProject();
			if (!project) return;
			const nextProjects = await coderApi.listProjects();
			setProjects(nextProjects);
			await loadProject(project.id);
			await app.setExtensionStoreValue(ACTIVE_PROJECT_KEY, project.id);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Unable to add this project.');
		} finally {
			setBusy(false);
		}
	}, [loadProject, preview]);

	const removeProject = useCallback(
		async (projectId: string): Promise<void> => {
			if (runningRef.current || preview) return;
			setBusy(true);
			setError('');
			try {
				await coderApi.removeProject(projectId);
				const nextProjects = await coderApi.listProjects();
				setProjects(nextProjects);
				if (projectId === activeProjectId) {
					const nextProject = nextProjects[0];
					if (nextProject) {
						await loadProject(nextProject.id);
						await app.setExtensionStoreValue(ACTIVE_PROJECT_KEY, nextProject.id);
					} else {
						setActiveProjectId(undefined);
						setActiveSessionId(undefined);
						setSessions([]);
						setBlocks([]);
						await app.deleteExtensionStoreValue(ACTIVE_PROJECT_KEY);
					}
				}
			} catch (reason) {
				setError(reason instanceof Error ? reason.message : 'Unable to remove this project.');
			} finally {
				setBusy(false);
			}
		},
		[activeProjectId, loadProject, preview]
	);

	const cancelRun = useCallback(() => {
		if (!runningRef.current) return;
		cancelRequestedRef.current = true;
		setRunLabel('Stopping');
		const runId = activeRunIdRef.current;
		if (runId && !preview) void coderApi.cancel(runId).catch(() => undefined);
	}, [preview]);

	const send = useCallback(async (): Promise<void> => {
		const requestInput = input.trim();
		const project = projects.find((item) => item.id === activeProjectId);
		if (!requestInput || !project || !project.available || runningRef.current) return;
		if (!settings.modelId.trim()) {
			setError('Select and connect a model in Friday Settings → Coder before starting.');
			setRunState('error');
			setRunLabel('Setup needed');
			return;
		}
		if (preview) {
			setInput('');
			setBlocks((current) => [
				...current,
				{
					id: crypto.randomUUID(),
					type: mode === 'shell' ? 'command' : 'message',
					...(mode === 'shell'
						? {
								command: requestInput,
								output: 'Preview only',
								status: 'succeeded' as const,
								truncated: false,
							}
						: { role: 'user' as const, content: requestInput, status: 'complete' as const }),
					timestamp: new Date().toISOString(),
				} as CoderBlock,
			]);
			return;
		}

		const commandBlockId = crypto.randomUUID();
		runningRef.current = true;
		cancelRequestedRef.current = false;
		activeRunIdRef.current = '';
		setInput('');
		setError('');
		setRunState('running');
		setRunLabel(mode === 'shell' ? 'Starting command' : 'Starting agent');
		setBlocks((current) => [
			...current,
			mode === 'shell'
				? {
						id: commandBlockId,
						type: 'command',
						command: requestInput,
						output: '',
						status: 'running',
						truncated: false,
						timestamp: new Date().toISOString(),
					}
				: {
						id: crypto.randomUUID(),
						type: 'message',
						role: 'user',
						content: requestInput,
						status: 'complete',
						timestamp: new Date().toISOString(),
					},
		]);

		const onEvent = (event: CoderResponseEvent): void => {
			if (event.type === 'status') {
				if (event.status === 'started') {
					activeRunIdRef.current = event.runId;
					setActiveSessionId(event.sessionId);
					setRunLabel(mode === 'shell' ? 'Running command' : 'Agent running');
					if (cancelRequestedRef.current) void coderApi.cancel(event.runId).catch(() => undefined);
				} else if (event.status === 'cancelled') {
					setRunLabel('Cancelled');
					setBlocks((current) =>
						current.map((block) =>
							block.type === 'command' && block.id === commandBlockId
								? { ...block, status: 'cancelled' }
								: block.type === 'message' && block.status === 'streaming'
									? { ...block, status: 'complete' }
									: block
						)
					);
				} else {
					setRunLabel('Complete');
					setBlocks((current) =>
						current.map((block) =>
							block.type === 'message' && block.status === 'streaming'
								? { ...block, status: 'complete' }
								: block
						)
					);
				}
				return;
			}
			if (event.type === 'text-delta') {
				setRunLabel('Responding');
				setBlocks((current) => {
					const last = current.at(-1);
					if (last?.type === 'message' && last.role === 'assistant' && last.status === 'streaming') {
						return current.map((block) =>
							block.id === last.id ? { ...last, content: last.content + event.delta } : block
						);
					}
					return [
						...current,
						{
							id: crypto.randomUUID(),
							type: 'message',
							role: 'assistant',
							content: event.delta,
							status: 'streaming',
							timestamp: new Date().toISOString(),
						},
					];
				});
				return;
			}
			if (event.type === 'thinking-delta') {
				setRunLabel('Thinking');
				return;
			}
			if (event.type === 'tool-start') {
				setRunLabel(`Using ${event.toolName}`);
				setBlocks((current) => [
					...current,
					{
						id: event.toolCallId,
						type: 'tool',
						toolName: event.toolName,
						status: 'running',
						timestamp: new Date().toISOString(),
					},
				]);
				return;
			}
			if (event.type === 'tool-end') {
				setBlocks((current) =>
					current.map((block) =>
						block.type === 'tool' && block.id === event.toolCallId
							? { ...block, status: event.isError ? 'failed' : 'succeeded' }
							: block
					)
				);
				return;
			}
			if (event.type === 'command-output') {
				setBlocks((current) =>
					current.map((block) =>
						block.type === 'command' && block.id === commandBlockId
							? { ...block, output: block.output + event.delta }
							: block
					)
				);
				return;
			}
			if (event.type === 'command-end') {
				setBlocks((current) =>
					current.map((block) =>
						block.type === 'command' && block.id === commandBlockId
							? {
									...block,
									status: event.cancelled
										? 'cancelled'
										: event.exitCode === 0
											? 'succeeded'
											: 'failed',
									...(event.exitCode === undefined ? {} : { exitCode: event.exitCode }),
									truncated: event.truncated,
								}
							: block
					)
				);
				return;
			}
			if (event.type === 'error') {
				setError(event.message);
				setRunState('error');
				setRunLabel('Failed');
			}
		};

		try {
			const result = await coderApi.send(
				{
					projectId: project.id,
					...(activeSessionId ? { sessionId: activeSessionId } : {}),
					mode,
					input: requestInput,
				},
				onEvent
			);
			setActiveSessionId(result.sessionId);
			setRunState('idle');
			setRunLabel('Ready');
			const [nextProjects, nextSessions] = await Promise.all([
				coderApi.listProjects(),
				coderApi.listSessions(project.id),
			]);
			setProjects(nextProjects);
			setSessions(nextSessions);
		} catch (reason) {
			const message = reason instanceof Error ? reason.message : 'Coder could not finish this task.';
			const cancelled = cancelRequestedRef.current || message === 'Coder run cancelled.';
			setRunState(cancelled ? 'idle' : 'error');
			setRunLabel(cancelled ? 'Cancelled' : 'Failed');
			if (!cancelled) setError(message);
		} finally {
			activeRunIdRef.current = '';
			cancelRequestedRef.current = false;
			runningRef.current = false;
		}
	}, [activeProjectId, activeSessionId, input, mode, preview, projects, settings.modelId]);

	return {
		activeProject: projects.find((project) => project.id === activeProjectId),
		activeProjectId,
		activeSessionId,
		blocks,
		busy,
		error,
		input,
		isPreview: preview,
		leftOpen,
		loading: runState === 'loading',
		mode,
		modelId: settings.modelId,
		projects,
		providerId: settings.providerId,
		query,
		runLabel,
		runState,
		sessions,
		thinkingLevel: settings.thinkingLevel,
		toolMode: settings.toolMode,
		addProject,
		cancelRun,
		newSession,
		removeProject,
		selectProject,
		selectSession,
		send,
		setInput,
		setLeftOpen,
		setMode,
		setQuery,
	};
}
