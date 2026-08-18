import { z } from 'zod';
import { getA2aAgents, sendA2aMessage } from '../../a2a';
import { tool } from '../tool';

export const delegateA2aTool = tool({
	id: 'delegate_a2a',
	name: 'Delegate to remote agent',
	description: `Delegate a task to a configured remote A2A agent. Available agents: ${getA2aAgents().filter((agent) => agent.enabled).map((agent) => `${agent.id} (${agent.name})`).join(', ') || 'none configured'}.`,
	hardApproval: true,
	inputSchema: z.object({
		agentId: z.string().min(1).describe('Configured remote agent identifier.'),
		prompt: z.string().min(1).describe('Task or message to send to the remote agent.'),
	}),
	execute: ({ agentId, prompt }, signal) => sendA2aMessage(agentId, prompt, signal),
});
