import { randomUUID } from 'node:crypto';
import { Role, TaskState, type Message, type Task } from '@a2a-js/sdk';
import { createA2aClient } from './client';
import { discoverA2aAgent } from './discover';
import { a2aTaskOutcome } from './outcome';
import { getA2aAgents } from './store';
import { a2aText } from './text';

export async function sendA2aMessage(
	agentId: string,
	prompt: string,
	signal?: AbortSignal,
	taskId = '',
	contextId = ''
): Promise<string> {
	const agents = getA2aAgents().filter((agent) => agent.enabled);
	const remote =
		agents.find((agent) => agent.id === agentId) ?? agents.find((agent) => agent.name === agentId);
	if (!remote) throw new Error(`Enabled A2A agent not found: ${agentId}`);
	const card = await discoverA2aAgent(remote.url, remote.token, signal);
	const client = await createA2aClient(card);
	const request = {
		tenant: '',
		message: {
			messageId: randomUUID(),
			contextId,
			taskId,
			role: Role.ROLE_USER,
			parts: [
				{
					content: { $case: 'text' as const, value: prompt },
					metadata: undefined,
					filename: '',
					mediaType: 'text/plain',
				},
			],
			metadata: undefined,
			extensions: [],
			referenceTaskIds: [],
		},
		configuration: {
			acceptedOutputModes: card.defaultOutputModes.filter(
				(mode) => mode === 'text/plain' || mode === 'application/json'
			),
			taskPushNotificationConfig: undefined,
			returnImmediately: false,
		},
		metadata: undefined,
	};
	const options = {
		signal,
		...(remote.token ? { serviceParameters: { Authorization: `Bearer ${remote.token}` } } : {}),
	};
	if (card.capabilities?.streaming) {
		const messages: string[] = [];
		const artifacts = new Map<string, string>();
		let remoteTaskId = taskId;
		let remoteContextId = contextId;
		let state: TaskState | undefined;
		let statusText = '';
		let receivedBytes = 0;
		for await (const event of client.sendMessageStream(request, options)) {
			const payload = event.payload;
			if (payload?.$case === 'task') {
				remoteTaskId = payload.value.id;
				remoteContextId = payload.value.contextId;
				state = payload.value.status?.state;
				statusText = a2aText(payload.value.status?.message?.parts ?? []);
				for (const artifact of payload.value.artifacts) {
					const text = a2aText(artifact.parts);
					artifacts.set(artifact.artifactId, text);
					receivedBytes += Buffer.byteLength(text);
				}
			}
			if (payload?.$case === 'message') {
				const text = a2aText(payload.value.parts);
				messages.push(text);
				receivedBytes += Buffer.byteLength(text);
			}
			if (payload?.$case === 'artifactUpdate' && payload.value.artifact) {
				remoteTaskId = payload.value.taskId;
				remoteContextId = payload.value.contextId;
				const text = a2aText(payload.value.artifact.parts);
				const previous = artifacts.get(payload.value.artifact.artifactId) ?? '';
				artifacts.set(
					payload.value.artifact.artifactId,
					payload.value.append ? previous + text : text
				);
				receivedBytes += Buffer.byteLength(text);
			}
			if (payload?.$case === 'statusUpdate' && payload.value.status?.message) {
				remoteTaskId = payload.value.taskId;
				remoteContextId = payload.value.contextId;
				state = payload.value.status.state;
				statusText = a2aText(payload.value.status.message.parts);
				receivedBytes += Buffer.byteLength(statusText);
			}
			if (
				payload?.$case === 'statusUpdate' &&
				payload.value.status &&
				!payload.value.status.message
			) {
				remoteTaskId = payload.value.taskId;
				remoteContextId = payload.value.contextId;
				state = payload.value.status.state;
			}
			if (receivedBytes > 200_000) throw new Error('A2A response exceeded the 200 KB limit.');
		}
		const artifactText = [...artifacts.values()].filter(Boolean).join('\n');
		const messageText = messages.filter(Boolean).join('\n');
		const failed =
			state === TaskState.TASK_STATE_FAILED ||
			state === TaskState.TASK_STATE_CANCELED ||
			state === TaskState.TASK_STATE_REJECTED;
		return a2aTaskOutcome(
			remoteTaskId,
			remoteContextId,
			state,
			failed ? statusText || artifactText || messageText : artifactText || messageText || statusText
		);
	}
	const result = await client.sendMessage(request, options);
	if ('parts' in result)
		return a2aText((result as Message).parts) || 'Remote agent returned an empty message.';
	const task = result as Task;
	const artifacts = task.artifacts.flatMap((artifact) => artifact.parts);
	const artifactText = a2aText(artifacts);
	const statusText = a2aText(task.status?.message?.parts ?? []);
	const state = task.status?.state;
	const failed =
		state === TaskState.TASK_STATE_FAILED ||
		state === TaskState.TASK_STATE_CANCELED ||
		state === TaskState.TASK_STATE_REJECTED;
	return a2aTaskOutcome(
		task.id,
		task.contextId,
		state,
		failed ? statusText || artifactText : artifactText || statusText
	);
}
