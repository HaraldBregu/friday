import { readKnowledgeText } from '../read';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type {
	WikiApplyOptions,
	WikiApplyResult,
	WikiClaim,
	WikiContradiction,
	WikiReviewItem,
	WikiSource,
	WikiUpdate,
} from './types';
import { verifyWikiEvidence } from './wiki_verify_evidence';

export async function applyWikiUpdate(
	targetPath: string,
	source: WikiSource,
	update: WikiUpdate,
	options: WikiApplyOptions = {}
): Promise<WikiApplyResult> {
	let createdPages = 0;
	let updatedPages = 0;
	let claimsAdded = 0;
	let contradictionsDetected = 0;
	const reviewItems: WikiReviewItem[] = [];
	const pages = await Promise.all(
		update.pages.map(async (page) => ({
			...page,
			related: [...new Set(page.related ?? [])],
			claims: await Promise.all(
				(page.claims ?? []).map(async (claim) => ({
					...claim,
					evidence: options.repository
						? await Promise.all(
								claim.evidence.map((item) =>
									verifyWikiEvidence(item, options.repository!, options.signal)
								)
							)
						: claim.evidence,
				}))
			),
		}))
	);
	const titleIndex = new Map(pages.map((page, index) => [page.title.toLowerCase(), index]));
	for (const page of pages) {
		const links = [
			...page.content.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g),
			...(page.related ?? []).map(
				(link) => [link, link.replace(/^\[\[|\]\]$/g, '')] as RegExpMatchArray
			),
		];
		for (const link of links) {
			const targetIndex = titleIndex.get(String(link[1]).trim().toLowerCase());
			if (targetIndex === undefined || pages[targetIndex].path === page.path) continue;
			pages[targetIndex].related = [
				...new Set([...(pages[targetIndex].related ?? []), `[[${page.title}]]`]),
			];
		}
	}

	for (const page of pages) {
		options.signal?.throwIfAborted();
		const pagePath = path.resolve(targetPath, page.path);
		const existing = await readKnowledgeText(targetPath, page.path, options.signal, true);
		const previous = existing ? matter(existing) : undefined;
		const pageType =
			page.pageType ??
			String(previous?.data.page_type ?? (page.path.startsWith('sources/') ? 'source' : 'topic'));
		const previousBase = previous?.content
			.split('<!-- wiki:structured -->')[0]
			.replace(/^#\s+[^\n]+\n+/, '')
			.trim();
		const proposedBase = page.content.replace(/^#\s+[^\n]+\n+/, '').trim();
		const majorRewrite =
			options.requireReviewForMajorChanges !== false &&
			Boolean(existing) &&
			['comparison', 'synthesis'].includes(pageType) &&
			(previousBase?.length ?? 0) > 500 &&
			!proposedBase.includes(previousBase ?? '');
		if (majorRewrite) {
			const reviewId = `review-${createHash('sha256')
				.update(`${options.operationId ?? source.hash}:${page.path}:${proposedBase}`)
				.digest('hex')
				.slice(0, 16)}`;
			reviewItems.push({
				id: reviewId,
				operationId: options.operationId ?? `operation-${source.hash.slice(0, 16)}`,
				status: 'pending',
				reason: 'Major synthesis or comparison rewrite requires human review.',
				risk: 'high',
				affectedPages: [page.path],
				evidenceSourceIds: source.sourceId ? [source.sourceId] : [],
				proposedUpdate: { pages: [page] },
				createdAt: new Date().toISOString(),
				rollback: `Restore the current version of ${page.path}.`,
			});
			continue;
		}

		const previousSources = previous?.data.sources;
		const previousSourceIds = previous?.data.source_ids;
		const sources = [
			...new Set([
				...(Array.isArray(previousSources) ? previousSources.map(String) : []),
				...page.sources,
				source.relativePath,
			]),
		].sort();
		const sourceIds = [
			...new Set([
				...(Array.isArray(previousSourceIds) ? previousSourceIds.map(String) : []),
				...(page.sourceIds ?? []),
				...(source.sourceId ? [source.sourceId] : []),
			]),
		].sort();
		const previousClaims = Array.isArray(previous?.data.claims)
			? (previous.data.claims as WikiClaim[])
			: [];
		const claims = new Map(previousClaims.map((claim) => [claim.id, claim]));
		for (const claim of page.claims ?? []) {
			const stored = claims.get(claim.id);
			const evidence = [
				...new Map(
					[...(stored?.evidence ?? []), ...claim.evidence].map((item) => [
						`${item.sourceId}:${item.locator}:${item.evidenceType}`,
						item,
					])
				).values(),
			];
			claims.set(claim.id, {
				...stored,
				...claim,
				evidence,
				contradicts: [...new Set([...(stored?.contradicts ?? []), ...(claim.contradicts ?? [])])],
			});
			if (!stored) claimsAdded += 1;
		}
		const previousContradictions = Array.isArray(previous?.data.contradictions)
			? (previous.data.contradictions as WikiContradiction[])
			: [];
		const contradictions = new Map(
			previousContradictions.map((contradiction) => [contradiction.id, contradiction])
		);
		for (const contradiction of page.contradictions ?? []) {
			const stored = contradictions.get(contradiction.id);
			contradictions.set(contradiction.id, {
				...stored,
				...contradiction,
				claimIds: [...new Set([...(stored?.claimIds ?? []), ...contradiction.claimIds])],
				status:
					options.allowContradictionResolution !== true &&
					stored?.status === 'unresolved' &&
					contradiction.status !== 'unresolved'
						? 'unresolved'
						: contradiction.status,
			});
			if (!stored) contradictionsDetected += 1;
		}
		const openQuestions = [
			...new Set([
				...(Array.isArray(previous?.data.open_questions)
					? previous.data.open_questions.map(String)
					: []),
				...(page.openQuestions ?? []),
			]),
		];
		const tags = [
			...new Set([
				...(Array.isArray(previous?.data.tags) ? previous.data.tags.map(String) : []),
				...(page.tags ?? []),
			]),
		];
		const aliases = [
			...new Set([
				...(Array.isArray(previous?.data.aliases) ? previous.data.aliases.map(String) : []),
				...(page.aliases ?? []),
			]),
		];
		const related = [
			...new Set([
				...(Array.isArray(previous?.data.related) ? previous.data.related.map(String) : []),
				...(page.related ?? []),
			]),
		];
		const baseContent =
			previousBase && pageType !== 'source' && !previousBase.includes(proposedBase)
				? `${previousBase}\n\n## Evidence update: ${source.sourceId ?? source.relativePath}\n\n${proposedBase}`
				: proposedBase;
		const structured: string[] = [];
		if (claims.size > 0) {
			structured.push(
				`## Key claims\n\n${[...claims.values()]
					.map(
						(claim) =>
							`### ${claim.statement}\n\n**Evidence**\n${claim.evidence
								.map((item) => `- \`${item.sourceId}\` — ${item.locator} (${item.evidenceType})`)
								.join('\n')}\n\n**Confidence:** ${claim.confidence}\n\n**Status:** ${claim.status}`
					)
					.join('\n\n')}`
			);
		}
		if (related.length > 0) {
			structured.push(`## Relationships\n\n${related.map((item) => `- ${item}`).join('\n')}`);
		}
		if (contradictions.size > 0) {
			structured.push(
				`## Contradictions and uncertainty\n\n${[...contradictions.values()]
					.map(
						(item) =>
							`### ${item.description}\n\n- Claims: ${item.claimIds.map((id) => `\`${id}\``).join(', ')}\n- Status: ${item.status}${item.requiredFollowUp ? `\n- Required follow-up: ${item.requiredFollowUp}` : ''}`
					)
					.join('\n\n')}`
			);
		}
		if (openQuestions.length > 0) {
			structured.push(
				`## Open questions\n\n${openQuestions.map((item) => `- ${item}`).join('\n')}`
			);
		}
		const previousHistory = Array.isArray(previous?.data.change_history)
			? previous.data.change_history.map(String)
			: [];
		const changeHistory = [
			...previousHistory,
			`${new Date().toISOString()}: integrated ${source.sourceId ?? source.relativePath}`,
		];
		structured.push(`## Change history\n\n${changeHistory.map((item) => `- ${item}`).join('\n')}`);
		const body = `# ${page.title}\n\n${baseContent}\n\n<!-- wiki:structured -->\n\n${structured.join('\n\n')}`;
		const pageId =
			page.id ??
			page.path
				.slice(0, -3)
				.replace(/[^a-zA-Z0-9]+/g, '-')
				.replace(/^-|-$/g, '')
				.toLowerCase();
		const createdAt = String(previous?.data.created_at ?? new Date().toISOString());
		const updatedAt = new Date().toISOString();
		const markdown = matter.stringify(`${body.trim()}\n`, {
			id: pageId,
			title: page.title,
			page_type: pageType,
			status: page.status ?? previous?.data.status ?? 'active',
			summary: page.summary,
			updated: updatedAt,
			created_at: createdAt,
			updated_at: updatedAt,
			sources,
			source_ids: sourceIds,
			tags,
			aliases,
			related,
			confidence: page.confidence ?? previous?.data.confidence ?? 'medium',
			review_status: previous?.data.review_status ?? 'auto_generated',
			claims: [...claims.values()],
			contradictions: [...contradictions.values()],
			open_questions: openQuestions,
			change_history: changeHistory,
		});
		await mkdir(path.dirname(pagePath), { recursive: true, mode: 0o700 });
		await writeFile(pagePath, markdown, { encoding: 'utf8', signal: options.signal, mode: 0o600 });
		if (existing === undefined) createdPages += 1;
		else updatedPages += 1;
	}

	return {
		createdPages,
		updatedPages,
		...(claimsAdded > 0 ? { claimsAdded } : {}),
		...(contradictionsDetected > 0 ? { contradictionsDetected } : {}),
		...(reviewItems.length > 0 ? { pendingReviews: reviewItems.length, reviewItems } : {}),
	};
}
