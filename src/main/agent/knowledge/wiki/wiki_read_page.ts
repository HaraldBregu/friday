import { readKnowledgeText } from '../read';
import { listKnowledgeFiles } from '../list';
import path from 'node:path';
import matter from 'gray-matter';
import { getWikiSettings } from './wiki_get_settings';
import type { WikiSearchResult } from './types';

export async function readWikiPage(
	page: string,
	targetPath = getWikiSettings().targetPath
): Promise<WikiSearchResult> {
	const requested = page.trim();
	if (!requested) throw new Error('Wiki page identifier is required.');
	const normalizedPath = path.posix.normalize(requested.replaceAll('\\', '/').replace(/^\.\//, ''));
	if (
		path.posix.isAbsolute(normalizedPath) ||
		normalizedPath === '..' ||
		normalizedPath.startsWith('../')
	) {
		throw new Error(`Unsafe wiki page identifier: ${page}`);
	}
	const entries = await listKnowledgeFiles(targetPath);
	for (const entry of entries) {
		const relativePath = entry.split(path.sep).join('/');
		if (path.posix.extname(relativePath).toLowerCase() !== '.md') continue;
		if (['index.md', 'log.md', 'AGENTS.md'].includes(relativePath)) continue;
		const parsed = matter(await readKnowledgeText(targetPath, entry));
		const title = String(parsed.data.title ?? path.posix.basename(relativePath, '.md')).trim();
		const aliases = Array.isArray(parsed.data.aliases) ? parsed.data.aliases.map(String) : [];
		const candidates = [
			relativePath,
			relativePath.slice(0, -3),
			String(parsed.data.id ?? ''),
			title,
			...aliases,
		].map((value) => value.toLowerCase());
		const wanted = normalizedPath.toLowerCase().replace(/\.md$/, '');
		if (!candidates.some((candidate) => candidate.replace(/\.md$/, '') === wanted)) continue;
		return {
			contentType: 'wiki_page',
			pageId: String(parsed.data.id ?? relativePath.slice(0, -3).replaceAll('/', '-')),
			path: relativePath,
			title,
			summary: String(parsed.data.summary ?? '').trim(),
			confidence: 1,
			sourceIds: Array.isArray(parsed.data.source_ids) ? parsed.data.source_ids.map(String) : [],
			content: parsed.content,
		};
	}
	throw new Error(`Wiki page not found: ${page}`);
}
