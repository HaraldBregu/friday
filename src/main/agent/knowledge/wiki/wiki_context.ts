import { readKnowledgeText } from '../read';
import { listKnowledgeFiles } from '../list';
import path from 'node:path';
import matter from 'gray-matter';
import type { WikiSource } from './types';

const MAX_CONTEXT_PAGES = 8;
const MAX_CONTEXT_CHARACTERS = 60_000;

export async function buildWikiContext(
	targetPath: string,
	source: WikiSource,
	signal?: AbortSignal
): Promise<string> {
	signal?.throwIfAborted();
	const sourceTerms = new Set(
		source.content
			.toLowerCase()
			.match(/[a-z0-9][a-z0-9-]{3,}/g)
			?.filter((term) => term.length > 3) ?? []
	);
	const entries = await listKnowledgeFiles(targetPath, signal);
	const pages: Array<{ path: string; content: string; score: number }> = [];

	for (const entry of entries) {
		signal?.throwIfAborted();
		if (path.extname(entry).toLowerCase() !== '.md') continue;
		if (['index.md', 'log.md', 'AGENTS.md'].includes(entry)) continue;
		const content = await readKnowledgeText(targetPath, entry, signal);
		const parsed = matter(content);
		const pageTerms =
			`${String(parsed.data.title ?? '')} ${String(parsed.data.summary ?? '')} ${parsed.content.slice(0, 20_000)}`
				.toLowerCase()
				.match(/[a-z0-9][a-z0-9-]{3,}/g) ?? [];
		const score = pageTerms.reduce((total, term) => total + Number(sourceTerms.has(term)), 0);
		pages.push({ path: entry.split(path.sep).join('/'), content, score });
	}

	const index = await readKnowledgeText(targetPath, 'index.md', signal, true);
	signal?.throwIfAborted();
	const selected = pages
		.sort((left, right) => right.score - left.score || left.path.localeCompare(right.path))
		.slice(0, MAX_CONTEXT_PAGES)
		.map((page) => `\n\n<existing-page path="${page.path}">\n${page.content}\n</existing-page>`)
		.join('');
	return `CURRENT INDEX\n${index || '(empty wiki)'}${selected}`.slice(0, MAX_CONTEXT_CHARACTERS);
}
