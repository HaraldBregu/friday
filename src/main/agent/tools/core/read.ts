import fs from 'node:fs/promises';
import { z } from 'zod';
import { agentLocation } from '../../../shared/agent_location';
import { resolveUserPath } from '../../../shared/user_path';
import { tool } from '../tool';

export const readTool = tool({
	id: 'read',
	name: 'Read file',
	description:
		'Read the full UTF-8 contents of a single text file. Use this before editing when you need the current file contents.',
	planSafe: true,
	inputSchema: z.object({
		path: z
			.string()
			.min(1)
			.describe(
				'Path relative to the agent filesystem root, or an absolute path. ~ is the OS user home.'
			),
	}),
	execute: async ({ path: filePath }) => {
		const resolved = resolveUserPath(filePath, agentLocation());
		return fs.readFile(resolved, 'utf8');
	},
});
