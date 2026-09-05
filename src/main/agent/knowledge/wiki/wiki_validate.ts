import { readKnowledgeText } from '../read';
import { listKnowledgeFiles } from '../list';
import path from 'node:path';
import matter from 'gray-matter';
import { getWikiRepository } from './wiki_repository';
import type { WikiClaim, WikiContradiction, WikiRepository } from './types';
import { verifyWikiEvidence } from './wiki_verify_evidence';

const PAGE_TYPES = new Set([
	'source',
	'entity',
	'concept',
	'topic',
	'project',
	'comparison',
	'synthesis',
	'question',
]);

export async function validateWiki(
	targetPath: string,
	repository: WikiRepository = getWikiRepository(targetPath),
	signal?: AbortSignal
): Promise<string[]> {
	const errors: string[] = [];
	const ids = new Map<string, string>();
	const entries = await listKnowledgeFiles(targetPath, signal);
	const pages: Array<{
		path: string;
		title: string;
		aliases: string[];
		content: string;
		data: Record<string, unknown>;
	}> = [];
	for (const entry of entries) {
		signal?.throwIfAborted();
		const relativePath = entry.split(path.sep).join('/');
		if (path.posix.extname(relativePath).toLowerCase() !== '.md') continue;
		if (['index.md', 'log.md', 'AGENTS.md'].includes(relativePath)) continue;
		try {
			const parsed = matter(await readKnowledgeText(targetPath, entry));
			const title = String(parsed.data.title ?? '').trim();
			if (!title) errors.push(`Missing title: ${relativePath}`);
			if (!String(parsed.data.summary ?? '').trim())
				errors.push(`Missing summary: ${relativePath}`);
			const generated = parsed.content.includes('<!-- wiki:structured -->');
			if (generated) {
				for (const key of [
					'id',
					'page_type',
					'status',
					'created_at',
					'updated_at',
					'source_ids',
					'confidence',
					'review_status',
				]) {
					if (parsed.data[key] === undefined) errors.push(`Missing ${key}: ${relativePath}`);
				}
			}
			const id = String(parsed.data.id ?? '').trim();
			if (id) {
				const duplicate = ids.get(id);
				if (duplicate) errors.push(`Duplicate page id '${id}': ${duplicate}, ${relativePath}`);
				else ids.set(id, relativePath);
			}
			const pageType = String(parsed.data.page_type ?? '');
			if (pageType && !PAGE_TYPES.has(pageType))
				errors.push(`Invalid page type '${pageType}': ${relativePath}`);
			const sourceIds = parsed.data.source_ids;
			if (sourceIds !== undefined && !Array.isArray(sourceIds)) {
				errors.push(`Invalid source_ids metadata: ${relativePath}`);
			}
			const pageClaims = (
				Array.isArray(parsed.data.claims) ? parsed.data.claims : []
			) as WikiClaim[];
			const claimIds = new Set<string>();
			for (const claim of pageClaims) {
				if (!claim.id || claimIds.has(claim.id))
					errors.push(`Duplicate or missing claim ID in ${relativePath}`);
				claimIds.add(claim.id);
				if (!claim.statement || !Array.isArray(claim.evidence) || claim.evidence.length === 0) {
					errors.push(`Unsupported claim '${claim.id}' in ${relativePath}`);
					continue;
				}
				for (const evidence of claim.evidence) {
					if (!evidence.locator || !repository.sources.store.sources[evidence.sourceId]) {
						errors.push(`Invalid evidence for claim '${claim.id}' in ${relativePath}`);
					} else if (evidence.excerptHash) {
						await verifyWikiEvidence(evidence, repository, signal).catch(() => {
							errors.push(`Invalid evidence for claim '${claim.id}' in ${relativePath}`);
						});
					}
				}
			}
			for (const contradiction of (Array.isArray(parsed.data.contradictions)
				? parsed.data.contradictions
				: []) as WikiContradiction[]) {
				if (contradiction.claimIds.some((claimId) => !claimIds.has(claimId))) {
					errors.push(
						`Contradiction '${contradiction.id}' references a missing claim in ${relativePath}`
					);
				}
			}
			pages.push({
				path: relativePath,
				title,
				aliases: Array.isArray(parsed.data.aliases) ? parsed.data.aliases.map(String) : [],
				content: parsed.content,
				data: parsed.data,
			});
		} catch (error) {
			errors.push(
				`Invalid Markdown frontmatter in ${relativePath}: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
	const lookup = new Set<string>();
	for (const page of pages) {
		lookup.add(page.path.toLowerCase());
		lookup.add(page.path.slice(0, -3).toLowerCase());
		lookup.add(page.title.toLowerCase());
		for (const alias of page.aliases) lookup.add(alias.toLowerCase());
	}
	for (const page of pages) {
		if (!page.content.includes('<!-- wiki:structured -->')) continue;
		for (const match of page.content.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g)) {
			if (!lookup.has(match[1].trim().toLowerCase())) {
				errors.push(`Broken link '[[${match[1].trim()}]]' in ${page.path}`);
			}
		}
	}
	const index = await readKnowledgeText(targetPath, 'index.md', undefined, true);
	for (const page of pages) {
		if (!index.includes(`[[${page.path.slice(0, -3)}|`))
			errors.push(`Index missing page: ${page.path}`);
	}
	return errors;
}
