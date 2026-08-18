import { randomUUID } from 'node:crypto';
import { ClientFactory } from '@a2a-js/sdk/client';
import type { Message, Part, Task } from '@a2a-js/sdk';
import { discoverA2aAgent } from './discover';
import { getA2aAgents } from './store';

const text = (parts: Part[]): string => parts.map((part) => part.content?.$case === 'text' ? part.content.value : part.content?.$case === 'data' ? JSON.stringify(part.content.value) : part.content?.$case === 'url' ? part.content.value : '').filter(Boolean).join('\n');

export async function sendA2aMessage(agentId: string, prompt: string, signal?: AbortSignal): Promise<string> {
	const remote = getA2aAgents().find((agent) => agent.id === agentId && agent.enabled);
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
	const result = await client.sendMessage(request, options);
	if ('parts' in result) return text((result as Message).parts);
	const task = result as Task;
	const artifacts = task.artifacts.flatMap((artifact) => artifact.parts);
	return text(artifacts) || text(task.status?.message?.parts ?? []) || `Remote task ${task.id} is ${task.status?.state ?? 'unknown'}.`;
}
