import { z } from 'zod';
import { searchWiki } from '../../knowledge/wiki/wiki_search';
import { tool } from '../tool';

export const searchWikiTool = tool({
	id: 'search_wiki',
	name: 'Search wiki',
	description:
		'Search compiled wiki pages by exact title, alias, metadata, full text, and linked-page relevance. Returns wiki synthesis, never primary evidence.',
	planSafe: true,
	inputSchema: z.object({
		query: z.string().trim().min(1),
		count: z.number().int().min(1).max(20).optional(),
	}),
	execute: async ({ query, count }, signal) => JSON.stringify(await searchWiki(query, count, undefined, signal), null, 2),
});
