import fs from 'node:fs/promises';
import { z } from 'zod';
import { agentLocation } from '../../../shared/agent_location';
import { resolveUserPath } from '../../../shared/user_path';
import { tool } from '../tool';
import { atomicWrite } from '../../../shared/atomic_write';

export const editTool = tool({
	id: 'edit',
	name: 'Edit file',
	description:
		'Edit a UTF-8 text file by replacing one exact text match. Use this for focused changes when the old text appears exactly once.',
	inputSchema: z.object({
		path: z
			.string()
			.min(1)
			.describe(
				'Path relative to the agent filesystem root, or an absolute path. ~ is the OS user home.'
			),
		oldText: z.string().min(1).describe('Exact text to replace.'),
		newText: z.string().describe('Replacement text.'),
	}),
	execute: async ({ path: filePath, oldText, newText }) => {
		const resolved = resolveUserPath(filePath, agentLocation());
		const content = await fs.readFile(resolved, 'utf8');
		const firstIndex = content.indexOf(oldText);
		if (firstIndex === -1) {
			throw new Error('edit oldText was not found.');
		}
		if (content.indexOf(oldText, firstIndex + oldText.length) !== -1) {
			throw new Error('edit oldText matched multiple locations.');
		}

		await atomicWrite(resolved, content.replace(oldText, newText));
		return { path: resolved };
	},
});
