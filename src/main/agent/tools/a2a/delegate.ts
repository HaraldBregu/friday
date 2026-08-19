import { z } from 'zod';
import { sendA2aMessage } from '../../a2a';
import { tool } from '../tool';

export const delegateA2aTool = tool({
	id: 'delegate_a2a',
	name: 'Delegate to remote agent',
	description: 'Delegate a task to a configured remote A2A agent. Call list_a2a_agents first to obtain a current enabled agent ID.',
	hardApproval: true,
	inputSchema: z.object({
		agentId: z.string().trim().min(1).describe('Configured remote agent identifier.'),
		prompt: z.string().trim().min(1).describe('Task or message to send to the remote agent.'),
		taskId: z.string().trim().min(1).optional().describe('Remote task ID when continuing an interrupted task.'),
		contextId: z.string().trim().min(1).optional().describe('Remote context ID when continuing an interrupted task.'),
	}),
	execute: ({ agentId, prompt, taskId, contextId }, signal) =>
		sendA2aMessage(agentId, prompt, signal, taskId, contextId),
});
