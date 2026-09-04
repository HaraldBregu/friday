import { z } from 'zod';
import { listApps } from '../../../apps/app_index';
import { tool } from '../tool';

export const listAppsTool = tool({
	id: 'list_apps',
	name: 'List apps',
	description: 'List the installed Kucedr apps available to open.',
	planSafe: true,
	inputSchema: z.object({}).strict(),
	execute: () => ({ apps: listApps() }),
});
