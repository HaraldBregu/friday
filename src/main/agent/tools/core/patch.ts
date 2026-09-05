import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { agentLocation } from '../../../shared/agent_location';
import { resolveUserPath } from '../../../shared/user_path';
import { tool } from '../tool';
import { atomicWrite } from '../../../shared/atomic_write';

import { parsePatch } from './patch/parse';
import { applyUpdateChunks } from './patch/update';

export const applyPatchTool = tool({
	id: 'patch',
	name: 'Apply patch',
	description:
		'Apply a multi-file patch using the *** Begin Patch/*** End Patch format. Supports Add File, Delete File, and Update File (with optional Move to) hunks.',
	hardApproval: ({ input }) =>
		/^\s*\*\*\* Delete File:/m.test(input) || /^\s*\*\*\* Move to:/m.test(input),
	inputSchema: z.object({
		input: z.string().min(1).describe('Patch content using the *** Begin Patch/End Patch format.'),
	}),
	execute: async ({ input }) => {
		const hunks = parsePatch(input);
		const added: string[] = [];
		const modified: string[] = [];
		const deleted: string[] = [];

		for (const hunk of hunks) {
			const target = resolveUserPath(hunk.path, agentLocation());
			if (hunk.kind === 'add') {
				await fs.mkdir(path.dirname(target), { recursive: true });
				await atomicWrite(target, hunk.contents);
				added.push(target);
			} else if (hunk.kind === 'delete') {
				await fs.rm(target);
				deleted.push(target);
			} else {
				const contents = await fs.readFile(target, 'utf8');
				const applied = applyUpdateChunks(target, contents, hunk.chunks);
				if (hunk.movePath) {
					const moveTarget = resolveUserPath(hunk.movePath, agentLocation());
					await fs.mkdir(path.dirname(moveTarget), { recursive: true });
					await atomicWrite(moveTarget, applied);
					if (moveTarget !== target) await fs.rm(target);
					modified.push(moveTarget);
				} else {
					await atomicWrite(target, applied);
					modified.push(target);
				}
			}
		}

		return {
			summary: [
				...added.map((f) => `A ${f}`),
				...modified.map((f) => `M ${f}`),
				...deleted.map((f) => `D ${f}`),
			].join('\n'),
		};
	},
});
