import { connectA2aAgent } from './connect';
import { sanitizeA2aError } from './error';
import { a2aTaskOutcome } from './outcome';
import { resolveA2aAgent } from './remote';
import { a2aText } from './text';

export async function cancelA2aTask(
	agentId: string,
	taskId: string,
	signal?: AbortSignal
): Promise<string> {
	const remote = resolveA2aAgent(agentId);
	try {
		const { client } = await connectA2aAgent(remote.url, remote, signal);
		const task = await client.cancelTask(
			{ tenant: '', id: taskId, metadata: undefined },
			{ signal }
		);
		return a2aTaskOutcome(
			task.id,
			task.contextId,
			task.status?.state,
			a2aText(task.status?.message?.parts ?? [])
		);
	} catch (error) {
		throw sanitizeA2aError(error, remote);
	}
}
