import { useCallback, useEffect, useRef, useState } from 'react';
import { agent, app, isFriday } from '@friday/sdk';

import type {
	CoderActivity,
	CoderController,
	CoderMessage,
	CoderPermission,
	CoderSession,
	RunState,
} from '@/types';

const sessionIdsKey = 'coder-session-ids';
const activeSessionKey = 'coder-active-session';
const initialSessionId = crypto.randomUUID();
const previewNow = Date.now();

export function useCoder(): CoderController {
	const preview = !isFriday();
	const activeRunIdRef = useRef('');
	const [sessions, setSessions] = useState<CoderSession[]>(() =>
		preview
			? [
					{ id: initialSessionId, title: 'Refine command palette', createdAtMs: previewNow },
					{ id: 'preview-2', title: 'Fix extension loading state', createdAtMs: previewNow - 86_400_000 },
				]
			: []
	);
	const [activeSessionId, setActiveSessionId] = useState<string>(initialSessionId);
	const [messages, setMessages] = useState<CoderMessage[]>(
		preview
			? [
					{
						id: 'preview-user',
						role: 'user',
						content: 'Make the command palette remember the most recently used actions.',
						status: 'complete',
					},
					{
						id: 'preview-assistant',
						role: 'assistant',
						content:
							'I traced the palette state and kept the change local to its context provider. The recent actions are now restored on launch and updated only after a command succeeds.\n\nVerification passed for the focused renderer tests.',
						status: 'complete',
					},
				]
			: []
	);
	const [activities, setActivities] = useState<CoderActivity[]>(
		preview
			? [
					{ id: 'preview-a', name: 'read', status: 'ok', detail: 'CommandMenu.tsx', durationMs: 42 },
					{ id: 'preview-b', name: 'edit', status: 'ok', detail: 'recent.ts', durationMs: 117 },
					{ id: 'preview-c', name: 'bash', status: 'ok', detail: 'renderer tests', durationMs: 2310 },
				]
			: []
	);
	const [workspaceLocation, setWorkspaceLocation] = useState(preview ? '/workspace/friday' : '');
	const [sessionsLoading, setSessionsLoading] = useState(!preview);
	const [input, setInput] = useState('');
	const [modelId, setModelId] = useState(preview ? 'gpt-5.4' : 'Default model');
	const [runState, setRunState] = useState<RunState>('idle');
	const [runLabel, setRunLabel] = useState(preview ? 'Preview' : 'Ready');
	const [permission, setPermission] = useState<CoderPermission | null>(null);
	const [error, setError] = useState('');
	const [leftOpen, setLeftOpen] = useState(true);

	useEffect(() => {
		if (preview) return;
		let active = true;
		void Promise.all([
			agent.listSessions(),
			agent.getWorkspaceLocation(),
			agent.getModelId(),
			app.getExtensionStoreValue<string[]>(sessionIdsKey),
			app.getExtensionStoreValue<string>(activeSessionKey),
		])
			.then(async ([allSessions, location, currentModel, storedIds, storedActive]) => {
				if (!active) return;
				const ids = new Set(storedIds ?? []);
				const coderSessions = allSessions.filter((session) => ids.has(session.id));
				setSessions(coderSessions);
				setWorkspaceLocation(location);
				setModelId(currentModel || 'Default model');
				const nextActive = storedActive && ids.has(storedActive) ? storedActive : initialSessionId;
				setActiveSessionId(nextActive);
				if (ids.has(nextActive)) {
					const history = await agent.getLastMessages(nextActive);
					if (!active) return;
					setMessages(
						history.flatMap((item, index) => {
							if (item.role !== 'user' && item.role !== 'agent' && item.role !== 'assistant') return [];
							const blockText = [...(item.blocks ?? []), ...(item.contentBlocks ?? [])]
								.filter((block) => block.type === 'text')
								.map((block) => block.text)
								.join('\n');
							const content = item.content || blockText;
							if (!content) return [];
							return [
								{
									id: `history-${index}`,
									role: item.role === 'user' ? ('user' as const) : ('assistant' as const),
									content,
									status: item.isError ? ('error' as const) : ('complete' as const),
								},
							];
						})
					);
				}
			})
			.catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load Coder.'))
			.finally(() => {
				if (!active) return;
				setSessionsLoading(false);
			});
		return () => {
			active = false;
		};
	}, [preview]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (!(event.metaKey || event.ctrlKey)) return;
			if (event.key.toLowerCase() === 'n') {
				event.preventDefault();
				setActiveSessionId(crypto.randomUUID());
				setMessages([]);
				setActivities([]);
				setPermission(null);
				window.requestAnimationFrame(() =>
					document.querySelector<HTMLTextAreaElement>('#coder-composer')?.focus()
				);
			}
			if (event.key === '/') {
				event.preventDefault();
				document.querySelector<HTMLTextAreaElement>('#coder-composer')?.focus();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	const createSession = useCallback(() => {
		setActiveSessionId(crypto.randomUUID());
		setMessages([]);
		setActivities([]);
		setPermission(null);
		setError('');
		window.requestAnimationFrame(() =>
			document.querySelector<HTMLTextAreaElement>('#coder-composer')?.focus()
		);
	}, []);

	const selectSession = useCallback(async (sessionId: string) => {
		if (activeRunIdRef.current) return;
		setActiveSessionId(sessionId);
		setMessages([]);
		setActivities([]);
		setPermission(null);
		setError('');
		if (!isFriday()) return;
		void app.setExtensionStoreValue(activeSessionKey, sessionId);
		try {
			const history = await agent.getLastMessages(sessionId);
			setMessages(
				history.flatMap((item, index) => {
					if (item.role !== 'user' && item.role !== 'agent' && item.role !== 'assistant') return [];
					const content =
						item.content ||
						[...(item.blocks ?? []), ...(item.contentBlocks ?? [])]
							.filter((block) => block.type === 'text')
							.map((block) => block.text)
							.join('\n');
					if (!content) return [];
					return [
						{
							id: `history-${index}`,
							role: item.role === 'user' ? ('user' as const) : ('assistant' as const),
							content,
							status: item.isError ? ('error' as const) : ('complete' as const),
						},
					];
				})
			);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Unable to load this task.');
		}
	}, []);

	const cancelRun = useCallback(() => {
		const runId = activeRunIdRef.current;
		if (runId && isFriday()) void agent.cancel(runId).catch(() => undefined);
		activeRunIdRef.current = '';
		setRunState('idle');
		setRunLabel('Cancelled');
		setMessages((current) =>
			current.map((message) =>
				message.status === 'streaming' ? { ...message, status: 'complete' } : message
			)
		);
	}, []);

	const approvePermission = useCallback(
		async (decision: 'approve' | 'reject' | 'approve_always') => {
			if (!permission || !isFriday()) return;
			await agent.respondToolPermission(
				{
					approvalId: permission.approvalId,
					runId: permission.runId,
					toolName: permission.toolName,
					inputFingerprint: permission.inputFingerprint,
				},
				decision
			);
			setPermission(null);
			setRunState('running');
			setRunLabel(decision === 'reject' ? 'Continuing without action' : 'Running approved action');
		},
		[permission]
	);

	const send = useCallback(async () => {
		const prompt = input.trim();
		if (!prompt || activeRunIdRef.current) return;
		if (!isFriday()) {
			setInput('');
			setMessages((current) => [
				...current,
				{ id: crypto.randomUUID(), role: 'user', content: prompt, status: 'complete' },
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					content: 'This preview becomes a live coding agent when the extension runs inside Friday.',
					status: 'complete',
				},
			]);
			return;
		}

		const runId = crypto.randomUUID();
		const assistantId = crypto.randomUUID();
		activeRunIdRef.current = runId;
		setInput('');
		setError('');
		setActivities([]);
		setPermission(null);
		setRunState('running');
		setRunLabel('Starting');
		setMessages((current) => [
			...current,
			{ id: crypto.randomUUID(), role: 'user', content: prompt, status: 'complete' },
			{ id: assistantId, role: 'assistant', content: '', status: 'streaming' },
		]);

		try {
			const response = await agent.send(
				prompt,
				{ runId, sessionId: activeSessionId, contextMode: 'workspace', effort: 'high' },
				(event) => {
					if (event.runId !== runId) return;
					if (event.type === 'run_state') {
						setRunLabel(event.label || event.state.replaceAll('_', ' '));
						if (event.state === 'error') setRunState('error');
					}
					if (event.type === 'text_delta') {
						setMessages((current) =>
							current.map((message) =>
								message.id === assistantId
									? { ...message, content: message.content + event.delta }
									: message
							)
						);
					}
					if (event.type === 'tool_call_start') {
						setRunLabel(`Using ${event.displayName || event.toolName}`);
						setActivities((current) => [
							...current,
							{
								id: event.toolCallId,
								name: event.displayName || event.toolName,
								status: 'running',
								detail: 'Preparing action',
							},
						]);
					}
					if (event.type === 'tool_call_input') {
						const inputData =
							typeof event.input === 'object' && event.input !== null
								? (event.input as Record<string, unknown>)
								: {};
						const pathValue = inputData.path ?? inputData.filePath ?? inputData.file_path;
						const path = typeof pathValue === 'string' ? pathValue : '';
						setActivities((current) =>
							current.map((item) =>
								item.id === event.toolCallId
									? {
											...item,
											detail: path || event.argsText || 'Action ready',
										}
									: item
							)
						);
					}
					if (event.type === 'tool_call_result') {
						setActivities((current) =>
							current.map((item) =>
								item.id === event.toolCallId
									? {
											...item,
											status:
												event.status === 'ok'
													? 'ok'
													: event.status === 'blocked' || event.status === 'rejected'
														? 'blocked'
														: 'error',
											detail: event.errorText || item.detail,
											durationMs: event.durationMs,
										}
									: item
							)
						);
					}
					if (event.type === 'tool_permission_request') {
						setPermission({
							approvalId: event.approvalId,
							runId: event.runId,
							toolName: event.toolName,
							inputFingerprint: event.inputFingerprint,
							detail: event.detail || 'Coder needs permission to continue.',
							targets: event.targets,
						});
						setRunState('approval');
						setRunLabel('Needs approval');
					}
				}
			);
			setMessages((current) =>
				current.map((message) =>
					message.id === assistantId
						? { ...message, content: message.content || response, status: 'complete' }
						: message
				)
			);
			const allSessions = await agent.listSessions();
			const session = allSessions.find((item) => item.id === activeSessionId);
			setSessions((current) => {
				const next = session
					? [session, ...current.filter((item) => item.id !== session.id)]
					: current;
				void app.setExtensionStoreValue(
					sessionIdsKey,
					next.map((item) => item.id)
				);
				return next;
			});
			void app.setExtensionStoreValue(activeSessionKey, activeSessionId);
			setRunState('idle');
			setRunLabel('Ready');
		} catch (reason) {
			const message = reason instanceof Error ? reason.message : 'Coder could not finish this task.';
			setError(message);
			setRunState('error');
			setRunLabel('Failed');
			setMessages((current) =>
				current.map((item) =>
					item.id === assistantId ? { ...item, content: item.content || message, status: 'error' } : item
				)
			);
		} finally {
			activeRunIdRef.current = '';
		}
	}, [activeSessionId, input]);

	const workspaceName = workspaceLocation.split(/[\\/]/).filter(Boolean).at(-1) || 'Agent workspace';
	const activeSessionTitle =
		sessions.find((session) => session.id === activeSessionId)?.title || 'New coding task';

	return {
		activities,
		activeSessionId,
		activeSessionTitle,
		error,
		input,
		isPreview: preview,
		leftOpen,
		messages,
		modelId,
		permission,
		runLabel,
		runState,
		sessions,
		sessionsLoading,
		workspaceLocation,
		workspaceName,
		approvePermission,
		cancelRun,
		createSession,
		selectSession,
		send,
		setInput,
		setLeftOpen,
	};
}
