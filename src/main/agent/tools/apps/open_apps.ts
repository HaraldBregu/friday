import { z } from 'zod';
import type { WindowFactory } from '../../../window_factory';
import { listExtensions, loadExtension } from '../../../extensions/extension_index';
import { tool } from '../tool';

export function openExtensionsTool(windowFactory: WindowFactory) {
	return tool({
		id: 'open_extensions',
		name: 'Open extensions',
		description: 'Open one or more installed Kucedr extensions by exact ID.',
		inputSchema: z.object({
			ids: z
				.union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)])
				.describe('One extension ID or a list of extension IDs returned by list_extensions.'),
		}),
		execute: ({ ids }, signal) => {
			const requestedIds = [...new Set(typeof ids === 'string' ? [ids] : ids)];
			const available = new Map(listExtensions().map((extension) => [extension.id, extension]));
			const missingIds = requestedIds.filter((id) => !available.has(id));
			if (missingIds.length > 0) throw new Error(`Extensions not found: ${missingIds.join(', ')}`);

			for (const id of requestedIds) {
				signal?.throwIfAborted();
				loadExtension(windowFactory, available.get(id)!);
			}
			return { opened: requestedIds };
		},
	});
}
