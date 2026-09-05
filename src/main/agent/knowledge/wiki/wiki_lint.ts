import { readKnowledgeText } from '../read';
import { listKnowledgeFiles } from '../list';
import path from 'node:path';
import matter from 'gray-matter';
import { getWikiSettings } from './wiki_get_settings';
import { rebuildWikiIndex } from './wiki_index';
import { appendWikiLog } from './wiki_log';
import { getWikiRepository } from './wiki_repository';
import { transactWiki } from './wiki_transaction';
import { incrementWikiMetric } from './wiki_metrics';
import type {
	WikiClaim,
	WikiContradiction,
	WikiLintResult,
	WikiOperationRecord,
	WikiSource,
} from './types';
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

export async function lintWiki(
	autoFix = false,
	targetPath = getWikiSettings().targetPath
): Promise<WikiLintResult> {
	const repository = getWikiRepository(targetPath);
	const result: WikiLintResult = {
		critical: [],
		warnings: [],
		suggestions: [],
		autoFixable: [],
		requiresReview: [],
		fixed: 0,
	};
	const entries = await listKnowledgeFiles(targetPath);
	const pages: Array<{
		path: string;
		title: string;
		aliases: string[];
		related: string[];
		links: string[];
		data: Record<string, unknown>;
		content: string;
	}> = [];
	const ids = new Map<string, string>();
	const aliases = new Map<string, string>();
	const claims = new Map<string, string>();
	for (const entry of entries) {
		const relativePath = entry.split(path.sep).join('/');
		if (path.posix.extname(relativePath).toLowerCase() !== '.md') continue;
		if (['index.md', 'log.md', 'AGENTS.md'].includes(relativePath)) continue;
		const parsed = matter(await readKnowledgeText(targetPath, entry));
		const title = String(parsed.data.title ?? '').trim();
		const pageId = String(parsed.data.id ?? '').trim();
		const pageType = String(parsed.data.page_type ?? '').trim();
		if (!title)
			result.critical.push({
				code: 'missing_metadata',
				message: 'Missing title.',
				path: relativePath,
			});
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
			if (parsed.data[key] === undefined) {
				result.warnings.push({
					code: 'missing_metadata',
					message: `Missing ${key}.`,
					path: relativePath,
				});
			}
		}
		if (pageId) {
			const duplicate = ids.get(pageId);
			if (duplicate) {
				result.critical.push({
					code: 'duplicate_page_id',
					message: `Duplicate page ID '${pageId}' also used by ${duplicate}.`,
					path: relativePath,
				});
			} else ids.set(pageId, relativePath);
		}
		if (pageType && !PAGE_TYPES.has(pageType)) {
			result.critical.push({
				code: 'invalid_page_type',
				message: `Invalid page type '${pageType}'.`,
				path: relativePath,
			});
		}
		const pageAliases = Array.isArray(parsed.data.aliases) ? parsed.data.aliases.map(String) : [];
		for (const alias of [title, ...pageAliases].filter(Boolean)) {
			const key = alias.toLowerCase();
			const collision = aliases.get(key);
			if (collision && collision !== relativePath) {
				result.requiresReview.push({
					code: 'alias_collision',
					message: `Alias '${alias}' also belongs to ${collision}.`,
					path: relativePath,
				});
			} else aliases.set(key, relativePath);
		}
		for (const claim of (Array.isArray(parsed.data.claims)
			? parsed.data.claims
			: []) as WikiClaim[]) {
			if (
				!claim.id ||
				!claim.statement ||
				!Array.isArray(claim.evidence) ||
				claim.evidence.length === 0
			) {
				result.critical.push({
					code: 'unsupported_claim',
					message: 'Claim has no traceable evidence.',
					path: relativePath,
					claimId: claim.id,
				});
				continue;
			}
			for (const evidence of claim.evidence) {
				if (!repository.sources.store.sources[evidence.sourceId]) {
					result.critical.push({
						code: 'invalid_source_reference',
						message: `Unknown source '${evidence.sourceId}'.`,
						path: relativePath,
						claimId: claim.id,
					});
				} else if (evidence.excerptHash) {
					await verifyWikiEvidence(evidence, repository).catch((error) => {
						result.critical.push({
							code: 'invalid_evidence',
							message: error instanceof Error ? error.message : String(error),
							path: relativePath,
							claimId: claim.id,
						});
					});
				}
			}
			const statement = claim.statement.trim().toLowerCase();
			const duplicate = claims.get(statement);
			if (duplicate && duplicate !== claim.id) {
				result.suggestions.push({
					code: 'duplicate_claim',
					message: `Claim duplicates '${duplicate}'.`,
					path: relativePath,
					claimId: claim.id,
				});
			} else claims.set(statement, claim.id);
		}
		for (const contradiction of (Array.isArray(parsed.data.contradictions)
			? parsed.data.contradictions
			: []) as WikiContradiction[]) {
			if (contradiction.status === 'unresolved') {
				result.requiresReview.push({
					code: 'unresolved_contradiction',
					message: contradiction.description,
					path: relativePath,
				});
			}
		}
		if (parsed.content.length > 50_000) {
			result.suggestions.push({
				code: 'oversized_page',
				message: 'Page may need to be split.',
				path: relativePath,
			});
		}
		pages.push({
			path: relativePath,
			title,
			aliases: pageAliases,
			related: Array.isArray(parsed.data.related) ? parsed.data.related.map(String) : [],
			links: [...parsed.content.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g)].map((match) =>
				match[1].trim()
			),
			data: parsed.data,
			content: parsed.content,
		});
	}
	const lookup = new Map<string, (typeof pages)[number]>();
	for (const page of pages) {
		lookup.set(page.path.toLowerCase(), page);
		lookup.set(page.path.slice(0, -3).toLowerCase(), page);
		lookup.set(page.title.toLowerCase(), page);
		for (const alias of page.aliases) lookup.set(alias.toLowerCase(), page);
	}
	const inbound = new Map(pages.map((page) => [page.path, 0]));
	for (const page of pages) {
		for (const link of page.links) {
			const linked = lookup.get(link.toLowerCase());
			if (!linked) {
				result.critical.push({
					code: 'broken_link',
					message: `Broken link [[${link}]].`,
					path: page.path,
				});
				continue;
			}
			inbound.set(linked.path, (inbound.get(linked.path) ?? 0) + 1);
			const reciprocal =
				linked.links.some((candidate) => candidate.toLowerCase() === page.title.toLowerCase()) ||
				linked.related.some(
					(candidate) =>
						candidate.replace(/^\[\[|\]\]$/g, '').toLowerCase() === page.title.toLowerCase()
				);
			if (!reciprocal) {
				result.autoFixable.push({
					code: 'missing_reciprocal_link',
					message: `${linked.title} does not link back to ${page.title}.`,
					path: linked.path,
				});
			}
		}
	}
	for (const page of pages) {
		if ((inbound.get(page.path) ?? 0) === 0 && String(page.data.page_type) !== 'source') {
			result.warnings.push({
				code: 'orphan_page',
				message: 'Page has no inbound links.',
				path: page.path,
			});
		}
	}
	const index = await readKnowledgeText(targetPath, 'index.md', undefined, true);
	for (const page of pages) {
		if (!index.includes(`[[${page.path.slice(0, -3)}|`)) {
			result.autoFixable.push({
				code: 'index_drift',
				message: 'Page is missing from index.md.',
				path: page.path,
			});
		}
	}
	const coveredSources = new Set(
		pages.flatMap((page) =>
			Array.isArray(page.data.source_ids) ? page.data.source_ids.map(String) : []
		)
	);
	for (const record of Object.values(repository.sources.store.sources)) {
		if (record.status === 'integrated' && !coveredSources.has(record.sourceId)) {
			result.warnings.push({
				code: 'source_not_integrated',
				message: `Integrated source '${record.sourceId}' has no wiki page.`,
			});
		}
	}
	repository.manifest.store = {
		version: 1,
		pages: Object.fromEntries(
			pages
				.filter((page) => typeof page.data.id === 'string' && page.data.id)
				.map((page) => [
					String(page.data.id),
					{
						id: String(page.data.id),
						path: page.path,
						title: page.title,
						pageType: String(page.data.page_type) as import('./types').WikiPageType,
						updatedAt: String(page.data.updated_at ?? page.data.updated ?? ''),
						sourceIds: Array.isArray(page.data.source_ids) ? page.data.source_ids.map(String) : [],
					},
				])
		),
	};
	const operationId = `operation-lint-${Date.now().toString(36)}`;
	const syntheticSource: WikiSource = {
		absolutePath: '',
		relativePath: 'wiki lint',
		content: '',
		hash: operationId,
	};
	await transactWiki({
		targetPath,
		operationId,
		repository,
		apply: async (stagedPath) => {
			if (autoFix) await rebuildWikiIndex(stagedPath);
			await appendWikiLog(
				stagedPath,
				syntheticSource,
				{ createdPages: 0, updatedPages: autoFix ? 1 : 0 },
				operationId,
				'lint',
				'Wiki integrity check'
			);
		},
		validate: async () => [],
	});
	if (autoFix && result.autoFixable.some((finding) => finding.code === 'index_drift'))
		result.fixed = 1;
	const now = new Date().toISOString();
	const operation: WikiOperationRecord = {
		id: operationId,
		type: 'lint',
		status: 'completed',
		startedAt: now,
		updatedAt: now,
		title: 'Wiki integrity check',
		createdPages: 0,
		updatedPages: result.fixed,
		claimsAdded: 0,
		contradictionsDetected: result.requiresReview.filter(
			(finding) => finding.code === 'unresolved_contradiction'
		).length,
		validationErrors: result.critical.map((finding) => finding.message),
		reviewStatus: result.requiresReview.length > 0 ? 'required' : 'not_required',
	};
	repository.operations.store = {
		...repository.operations.store,
		operations: { ...repository.operations.store.operations, [operationId]: operation },
	};
	incrementWikiMetric(
		'wiki_lint_findings_total',
		result.critical.length +
			result.warnings.length +
			result.suggestions.length +
			result.autoFixable.length +
			result.requiresReview.length
	);
	return result;
}
