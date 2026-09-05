import { readKnowledgeText } from '../read';
import { listKnowledgeFiles } from '../list';
import path from 'node:path';
import matter from 'gray-matter';
import { getWikiSettings } from './wiki_get_settings';
import { getWikiRepository } from './wiki_repository';
import type { WikiSearchResult } from './types';
import type { WikiClaim } from './types';
import { verifyWikiEvidence } from './wiki_verify_evidence';

export async function searchWiki(
	query: string,
	count = 5,
	targetPath = getWikiSettings().targetPath,
	signal?: AbortSignal
): Promise<WikiSearchResult[]> {
	signal?.throwIfAborted();
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) throw new Error('Wiki search query is required.');
	const limit = Math.max(1, Math.min(20, Math.trunc(count)));
	const repository = getWikiRepository(targetPath);
	const terms = [...new Set(normalizedQuery.match(/[\p{L}\p{N}][\p{L}\p{N}-]{1,}/gu) ?? [])];
	const index = await readKnowledgeText(targetPath, 'index.md', signal, true);
	const indexLines = index.toLowerCase().split('\n');
	const entries = await listKnowledgeFiles(targetPath, signal);
	const pages: Array<WikiSearchResult & { aliases: string[]; links: string[]; score: number }> = [];

	for (const entry of entries) {
		signal?.throwIfAborted();
		const relativePath = entry.split(path.sep).join('/');
		if (path.posix.extname(relativePath).toLowerCase() !== '.md') continue;
		if (['index.md', 'log.md', 'AGENTS.md'].includes(relativePath)) continue;
		const parsed = matter(
			await readKnowledgeText(targetPath, entry, signal)
		);
		if (String(parsed.data.status ?? '') !== 'active') continue;
		if (!['auto_generated', 'approved'].includes(String(parsed.data.review_status ?? ''))) continue;
		const claims = (Array.isArray(parsed.data.claims) ? parsed.data.claims : []) as WikiClaim[];
		const verified = await Promise.all(
			claims.flatMap((claim) => claim.evidence)
				.filter((evidence) => Boolean(evidence.excerptHash))
				.map((evidence) => verifyWikiEvidence(evidence, repository, signal).then(() => true).catch(() => false))
		);
		if (verified.some((value) => !value)) continue;
		const title = String(parsed.data.title ?? path.posix.basename(relativePath, '.md')).trim();
		const summary = String(parsed.data.summary ?? '').trim();
		const aliases = Array.isArray(parsed.data.aliases) ? parsed.data.aliases.map(String) : [];
		const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [];
		const sourceIds = Array.isArray(parsed.data.source_ids)
			? parsed.data.source_ids.map(String)
			: [];
		const titleLower = title.toLowerCase();
		const aliasesLower = aliases.map((alias) => alias.toLowerCase());
		const metadata = `${title} ${aliases.join(' ')} ${tags.join(' ')} ${summary}`.toLowerCase();
		const fullText = `${metadata} ${parsed.content}`.toLowerCase();
		let score = 0;
		if (titleLower === normalizedQuery) score = 1;
		else if (aliasesLower.includes(normalizedQuery)) score = 0.98;
		else if (titleLower.includes(normalizedQuery)) score = 0.92;
		else if (aliasesLower.some((alias) => alias.includes(normalizedQuery))) score = 0.9;
		else {
			const metadataMatches = terms.filter((term) => metadata.includes(term)).length;
			const textMatches = terms.filter((term) => fullText.includes(term)).length;
			if (metadataMatches > 0) score = 0.7 + 0.15 * (metadataMatches / Math.max(terms.length, 1));
			else if (textMatches > 0) score = 0.4 + 0.25 * (textMatches / Math.max(terms.length, 1));
		}
		const link = relativePath.slice(0, -3).toLowerCase();
		if (
			indexLines.some(
				(line) =>
					line.includes(normalizedQuery) &&
					(line.includes(`[[${link}|`) || line.includes(`[[${link}]]`))
			)
		) {
			score = Math.max(score, 0.86);
		}
		pages.push({
			contentType: 'wiki_page',
			pageId: String(parsed.data.id ?? link.replaceAll('/', '-')),
			path: relativePath,
			title,
			summary,
			confidence: score,
			sourceIds,
			content: parsed.content.slice(0, 16_000),
			aliases,
			links: [...parsed.content.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g)].map((match) =>
				match[1].trim().toLowerCase()
			),
			score,
		});
	}

	const titleMap = new Map(pages.map((page) => [page.title.toLowerCase(), page]));
	const strongest = [...pages].sort((left, right) => right.score - left.score).slice(0, 3);
	for (const page of strongest) {
		if (page.score <= 0) continue;
		for (const link of page.links) {
			const related = titleMap.get(link);
			if (related) related.score = Math.max(related.score, Math.min(0.8, page.score - 0.15));
		}
	}

	return pages
		.filter((page) => page.score > 0)
		.sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
		.slice(0, limit)
		.map(({ aliases: _aliases, links: _links, score, ...page }) => ({
			...page,
			confidence: Number(score.toFixed(3)),
		}));
}
