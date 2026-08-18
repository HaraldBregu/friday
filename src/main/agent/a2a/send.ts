import { randomUUID } from 'node:crypto';
import type { Message, Task } from '@a2a-js/sdk';
import { discoverA2aAgent } from './discover';
import { getA2aAgents } from './store';
import { a2aText } from './text';

export async function sendA2aMessage(agentId: string, prompt: string, signal?: AbortSignal): Promise<string> {
	const { ClientFactory } = await import('@a2a-js/sdk/client');
	const remote = getA2aAgents().find(
		(agent) => (agent.id === agentId || agent.name === agentId) && agent.enabled
	);
	if (!remote) throw new Error(`Enabled A2A agent not found: ${agentId}`);
	const card = await discoverA2aAgent(remote.url, remote.token);
	const client = await new ClientFactory().createFromAgentCard(card);
	const request = {
		tenant: '',
		message: { messageId: randomUUID(), contextId: '', taskId: '', role: 1, parts: [{ content: { $case: 'text' as const, value: prompt }, metadata: undefined, filename: '', mediaType: 'text/plain' }], metadata: undefined, extensions: [], referenceTaskIds: [] },
		configuration: {
			acceptedOutputModes: ['text/plain'],
			taskPushNotificationConfig: undefined,
			returnImmediately: false,
		},
		metadata: undefined,
	};
	const options = { signal, ...(remote.token ? { serviceParameters: { authorization: `Bearer ${remote.token}` } } : {}) };
	if (card.capabilities?.streaming) {
		const chunks: string[] = [];
		for await (const event of client.sendMessageStream(request, options)) {
			const payload = event.payload;
			if (payload?.$case === 'message') chunks.push(a2aText(payload.value.parts));
			if (payload?.$case === 'artifactUpdate' && payload.value.artifact) {
				chunks.push(a2aText(payload.value.artifact.parts));
			}
			if (payload?.$case === 'statusUpdate' && payload.value.status?.message) {
				chunks.push(a2aText(payload.value.status.message.parts));
			}
		}
		return chunks.filter(Boolean).join('\n');
	}
	const result = await client.sendMessage(request, options);
	if ('parts' in result) return a2aText((result as Message).parts);
	const task = result as Task;
	const artifacts = task.artifacts.flatMap((artifact) => artifact.parts);
	return a2aText(artifacts) || a2aText(task.status?.message?.parts ?? []) || `Remote task ${task.id} is ${task.status?.state ?? 'unknown'}.`;
}
