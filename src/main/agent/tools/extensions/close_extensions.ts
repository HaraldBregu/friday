import { z } from 'zod';
import { closeExtension } from '../../../extensions/extension_index';
import { tool } from '../tool';

export const closeExtensionsTool = tool({
	id: 'close_extensions',
	name: 'Close extensions',
	description: 'Request closure of one or more open Kucedr extensions by exact ID.',
	inputSchema: z.object({
		ids: z
			.union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)])
			.describe('One extension ID or a list of extension IDs. IDs that are not open are reported.'),
	}),
	execute: ({ ids }, signal) => {
		const requestedIds = [...new Set(typeof ids === 'string' ? [ids] : ids)];
		const requested: string[] = [];
		const notOpen: string[] = [];

		for (const id of requestedIds) {
			signal?.throwIfAborted();
			if (closeExtension(id)) {
				requested.push(id);
			} else {
				notOpen.push(id);
			}
		}

		return { requested, notOpen };
	},
});
