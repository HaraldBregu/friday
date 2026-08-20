import { useCallback, useEffect, useRef, useState } from 'react';
import {
	coder as coderApi,
	isFriday,
	type CoderResponseEvent,
	type CoderSettings,
} from '@friday/sdk';

import type { CoderActivity, CoderController, CoderMessage, RunState } from '@/controller';

const previewSettings: CoderSettings = {
	runtime: 'pi',
	providerId: 'openai-codex',
	modelId: 'gpt-5.4',
	thinkingLevel: 'high',
	toolMode: 'coding',
	workingDirectory: '/workspace/friday',
};

const initialSettings: CoderSettings = {
	runtime: 'pi',
	providerId: 'openai-codex',
	modelId: '',
	thinkingLevel: 'medium',
	toolMode: 'read-only',
	workingDirectory: '',
};

const previewMessages: CoderMessage[] = [
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
];

const previewActivities: CoderActivity[] = [
	{ id: 'preview-a', name: 'read', status: 'ok', detail: 'Completed' },
	{ id: 'preview-b', name: 'edit', status: 'ok', detail: 'Completed' },
	{ id: 'preview-c', name: 'bash', status: 'ok', detail: 'Completed' },
];

export function useCoder(): CoderController {
	const preview = !isFriday();
	const activeRunIdRef = useRef('');
	const cancelRequestedRef = useRef(false);
	const runningRef = useRef(false);
	const [settings, setSettings] = useState<CoderSettings>(
		preview ? previewSettings : initialSettings
	);
	const [messages, setMessages] = useState<CoderMessage[]>(preview ? previewMessages : []);
	const [activities, setActivities] = useState<CoderActivity[]>(preview ? previewActivities : []);
	const [input, setInput] = useState('');
	const [runState, setRunState] = useState<RunState>('idle');
	const [runLabel, setRunLabel] = useState(preview ? 'Preview' : 'Loading');
	const [error, setError] = useState('');
	const [leftOpen, setLeftOpen] = useState(true);

	useEffect(() => {
		if (preview) return;
		let active = true;
		void coderApi
			.getSettings()
			.then((current) => {
				if (!active) return;
				setSettings(current);
				setRunLabel(current.modelId ? 'Ready' : 'Setup needed');
			})
			.catch((reason) => {
				if (!active) return;
				setError(reason instanceof Error ? reason.message : 'Unable to load Coder.');
				setRunState('error');
				setRunLabel('Unavailable');
			});
		return () => {
			active = false;
		};
	}, [preview]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (!(event.metaKey || event.ctrlKey)) return;
			if (event.key.toLowerCase() === 'n' && !runningRef.current) {
				event.preventDefault();
				setMessages([]);
				setActivities([]);
				setError('');
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

	const clearTerminal = useCallback(() => {
		if (runningRef.current) return;
		setMessages([]);
		setActivities([]);
		setError('');
		setRunState('idle');
		setRunLabel(settings.modelId ? 'Ready' : 'Setup needed');
		window.requestAnimationFrame(() =>
			document.querySelector<HTMLTextAreaElement>('#coder-composer')?.focus()
		);
	}, [settings.modelId]);

	const cancelRun = useCallback(() => {
		if (!runningRef.current) return;
		cancelRequestedRef.current = true;
		setRunLabel('Stopping');
		const runId = activeRunIdRef.current;
		if (runId && !preview) void coderApi.cancel(runId).catch(() => undefined);
	}, [preview]);

	const send = useCallback(async () => {
		const prompt = input.trim();
		if (!prompt || runningRef.current) return;
		if (preview) {
			setInput('');
			setMessages((current) => [
				...current,
				{ id: crypto.randomUUID(), role: 'user', content: prompt, status: 'complete' },
				{
					id: crypto.randomUUID(),
					role: 'assistant',
					content: 'This preview becomes a live Pi coding agent when it runs inside Friday.',
					status: 'complete',
				},
			]);
			return;
		}

		const assistantId = crypto.randomUUID();
		runningRef.current = true;
		cancelRequestedRef.current = false;
		activeRunIdRef.current = '';
		setInput('');
		setError('');
		setActivities([]);
		setRunState('running');
		setRunLabel('Starting');
		setMessages((current) => [
			...current,
			{ id: crypto.randomUUID(), role: 'user', content: prompt, status: 'complete' },
			{ id: assistantId, role: 'assistant', content: '', status: 'streaming' },
		]);

		const onEvent = (event: CoderResponseEvent): void => {
			if (event.type === 'status') {
				if (event.status === 'started') {
					activeRunIdRef.current = event.runId;
					setRunLabel('Running');
					if (cancelRequestedRef.current) {
						void coderApi.cancel(event.runId).catch(() => undefined);
					}
				} else if (event.status === 'cancelled') {
					setRunLabel('Cancelled');
				} else {
					setRunLabel('Finishing');
				}
				return;
			}
			if (event.type === 'text-delta') {
				setMessages((current) =>
					current.map((message) =>
						message.id === assistantId
							? { ...message, content: message.content + event.delta }
							: message
					)
				);
				return;
			}
			if (event.type === 'thinking-delta') {
				setRunLabel('Thinking');
				return;
			}
			if (event.type === 'tool-start') {
				setRunLabel(`Using ${event.toolName}`);
				setActivities((current) => [
					...current,
					{
						id: event.toolCallId,
						name: event.toolName,
						status: 'running',
						detail: 'Running',
					},
				]);
				return;
			}
			if (event.type === 'tool-end') {
				setActivities((current) =>
					current.map((activity) =>
						activity.id === event.toolCallId
							? {
									...activity,
									status: event.isError ? 'error' : 'ok',
									detail: event.isError ? 'Failed' : 'Completed',
								}
							: activity
					)
				);
				return;
			}
			setError(event.message);
			setRunState('error');
			setRunLabel('Failed');
		};

		try {
			const current = await coderApi.getSettings();
			setSettings(current);
			if (!current.modelId.trim()) {
				throw new Error('Select a model in Friday Settings → Coder before starting a run.');
			}
			if (cancelRequestedRef.current) throw new Error('Coder run cancelled.');
			const response = await coderApi.send(prompt, onEvent);
			if (cancelRequestedRef.current) throw new Error('Coder run cancelled.');
			setMessages((currentMessages) =>
				currentMessages.map((message) =>
					message.id === assistantId
						? { ...message, content: message.content || response, status: 'complete' }
						: message
				)
			);
			setRunState('idle');
			setRunLabel('Ready');
		} catch (reason) {
			const message =
				reason instanceof Error ? reason.message : 'Coder could not finish this task.';
			const cancelled = cancelRequestedRef.current || message === 'Coder run cancelled.';
			setRunState(cancelled ? 'idle' : 'error');
			setRunLabel(cancelled ? 'Cancelled' : 'Failed');
			if (!cancelled) setError(message);
			setMessages((current) =>
				current.map((item) =>
					item.id === assistantId
						? {
								...item,
								content: item.content || (cancelled ? 'Run cancelled.' : message),
								status: cancelled ? 'complete' : 'error',
							}
						: item
				)
			);
		} finally {
			activeRunIdRef.current = '';
			cancelRequestedRef.current = false;
			runningRef.current = false;
		}
	}, [input, preview]);

	const workspaceName =
		settings.workingDirectory.split(/[\\/]/).filter(Boolean).at(-1) || 'Coder workspace';

	return {
		activities,
		error,
		input,
		isPreview: preview,
		leftOpen,
		messages,
		modelId: settings.modelId,
		providerId: settings.providerId,
		runLabel,
		runState,
		thinkingLevel: settings.thinkingLevel,
		toolMode: settings.toolMode,
		workingDirectory: settings.workingDirectory,
		workspaceName,
		cancelRun,
		clearTerminal,
		send,
		setInput,
		setLeftOpen,
	};
}
