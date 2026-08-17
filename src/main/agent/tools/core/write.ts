import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { agentLocation } from '../../../shared/agent_location';
import { resolveUserPath } from '../../../shared/user_path';
import { tool } from '../tool';
import { atomicWrite } from '../../../shared/atomic_write';

export const writeTool = tool({
	id: 'write',
	name: 'Write file',
	description:
		'Create or overwrite a UTF-8 text file with exact content, creating parent directories when needed.',
	hardApproval: ({ path: filePath }) => fs.existsSync(resolveUserPath(filePath, agentLocation())),
	inputSchema: z.object({
		path: z
			.string()
			.min(1)
			.describe(
				'Path relative to the agent filesystem root, or an absolute path. ~ is the OS user home.'
			),
		content: z.string().describe('UTF-8 text content to write.'),
	}),
	execute: async ({ path: filePath, content }) => {
		const resolved = resolveUserPath(filePath, agentLocation());
		await fsPromises.mkdir(path.dirname(resolved), { recursive: true });
		await atomicWrite(resolved, content);
		return { path: resolved };
	},
});
