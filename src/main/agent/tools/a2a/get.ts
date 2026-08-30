import { z } from 'zod';
import { getA2aTask } from '../../a2a';
import { tool } from '../tool';

export const getA2aTaskTool = tool({
	id: 'get_a2a_task',
	name: 'Get remote task',
	description: 'Get the current state and output of a known remote A2A task.',
	hardApproval: true,
	inputSchema: z.object({
		agentId: z.string().trim().min(1).max(200),
		taskId: z.string().trim().min(1).max(200),
	}),
	execute: ({ agentId, taskId }, signal) => getA2aTask(agentId, taskId, signal),
});
