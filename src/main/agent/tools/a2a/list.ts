import { z } from 'zod';
import { getA2aAgents } from '../../a2a';
import { tool } from '../tool';

export const listA2aAgentsTool = tool({
	id: 'list_a2a_agents',
	name: 'List remote agents',
	description: 'List configured and enabled remote A2A agents and their advertised skills.',
	planSafe: true,
	inputSchema: z.object({}),
	execute: () => getA2aAgents().filter((agent) => agent.enabled).map(({ token: _token, ...agent }) => agent),
});
