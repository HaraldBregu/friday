import { z } from 'zod';
import { listExtensions } from '../../../extensions/extension_index';
import { tool } from '../tool';

export const listExtensionsTool = tool({
	id: 'list_extensions',
	name: 'List extensions',
	description: 'List the installed Kucedr extensions available to open.',
	planSafe: true,
	inputSchema: z.object({}).strict(),
	execute: () => ({ extensions: listExtensions() }),
});
