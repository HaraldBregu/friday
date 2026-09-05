import { z } from 'zod';
import { readWikiPage } from '../../knowledge/wiki/wiki_read_page';
import { tool } from '../tool';

export const readWikiPageTool = tool({
	id: 'read_wiki_page',
	name: 'Read wiki page',
	description: 'Read one compiled wiki page by path, page ID, exact title, or alias.',
	planSafe: true,
	inputSchema: z.object({ page: z.string().trim().min(1) }),
	execute: async ({ page }, signal) =>
		JSON.stringify(await readWikiPage(page, undefined, signal), null, 2),
});
