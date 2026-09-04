import { z } from 'zod';
import { closeApp } from '../../../apps/app_index';
import { tool } from '../tool';

export const closeAppsTool = tool({
	id: 'close_apps',
	name: 'Close apps',
	description: 'Request closure of one or more open Kucedr apps by exact ID.',
	inputSchema: z.object({
		ids: z
			.union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)])
			.describe('One app ID or a list of app IDs. IDs that are not open are reported.'),
	}),
	execute: ({ ids }, signal) => {
		const requestedIds = [...new Set(typeof ids === 'string' ? [ids] : ids)];
		const requested: string[] = [];
		const notOpen: string[] = [];

		for (const id of requestedIds) {
			signal?.throwIfAborted();
			if (closeApp(id)) {
				requested.push(id);
			} else {
				notOpen.push(id);
			}
		}

		return { requested, notOpen };
	},
});
