import { z } from 'zod';
import type { WindowFactory } from '../../../window_factory';
import { listApps, loadApp } from '../../../apps/app_index';
import { tool } from '../tool';

export function openAppsTool(windowFactory: WindowFactory) {
	return tool({
		id: 'open_apps',
		name: 'Open apps',
		description: 'Open one or more installed Kucedr apps by exact ID.',
		inputSchema: z.object({
			ids: z
				.union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)])
				.describe('One app ID or a list of app IDs returned by list_apps.'),
		}),
		execute: ({ ids }, signal) => {
			const requestedIds = [...new Set(typeof ids === 'string' ? [ids] : ids)];
			const available = new Map(listApps().map((app) => [app.id, app]));
			const missingIds = requestedIds.filter((id) => !available.has(id));
			if (missingIds.length > 0) throw new Error(`Apps not found: ${missingIds.join(', ')}`);

			for (const id of requestedIds) {
				signal?.throwIfAborted();
				loadApp(windowFactory, available.get(id)!);
			}
			return { opened: requestedIds };
		},
	});
}
