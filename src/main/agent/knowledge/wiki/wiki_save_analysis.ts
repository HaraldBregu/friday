import { containsSecret } from '../secrets';
import { createHash } from 'node:crypto';
import { applyWikiUpdate } from './wiki_apply_update';
import { getWikiSettings } from './wiki_get_settings';
import { rebuildWikiIndex } from './wiki_index';
import { appendWikiLog } from './wiki_log';
import { readWikiPage } from './wiki_read_page';
import { getWikiRepository } from './wiki_repository';
import { transactWiki } from './wiki_transaction';
import type {
	WikiOperationRecord,
	WikiSaveAnalysisInput,
	WikiSaveAnalysisResult,
	WikiSource,
	WikiUpdate,
} from './types';

export async function saveWikiAnalysis(
	input: WikiSaveAnalysisInput
): Promise<WikiSaveAnalysisResult> {
	const settings = getWikiSettings();
	const repository = getWikiRepository(settings.targetPath);
	if (settings.enabled === false) throw new Error('Wiki is disabled.');
	const title = input.title.trim();
	const summary = input.summary.trim();
	const content = input.content.trim();
	if (!title || !summary || !content)
		throw new Error('Analysis title, summary, and content are required.');
	if (containsSecret([title, summary, content].join("\n"))) {
		throw new Error('Refusing to save analysis containing credential-like content.');
	}
	const sourceIds = [...new Set(input.sourceIds)];
	if (sourceIds.length === 0) throw new Error('Saved analysis requires at least one source ID.');
	const records = sourceIds.map((sourceId) => repository.sources.store.sources[sourceId]);
	if (records.some((record) => !record || record.status !== 'integrated')) {
		throw new Error('Saved analysis references an unknown or unintegrated source.');
	}
	const existing = await readWikiPage(title, settings.targetPath).catch(() => undefined);
	const directory =
		input.pageType === 'synthesis'
			? 'syntheses'
			: input.pageType === 'comparison'
				? 'comparisons'
				: input.pageType === 'project'
					? 'projects'
					: 'questions';
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 100);
	const pagePath = existing?.path ?? `${directory}/${slug || 'analysis'}.md`;
	const digest = createHash('sha256')
		.update(`${pagePath}:${content}:${sourceIds.join(':')}`)
		.digest('hex');
	const operationId = `operation-analysis-${digest.slice(0, 16)}`;
	const firstRecord = records[0]!;
	const source: WikiSource = {
		absolutePath: firstRecord.archivePath,
		relativePath: firstRecord.relativePaths[0] ?? firstRecord.originalName,
		content: '',
		hash: firstRecord.checksum,
		sourceId: firstRecord.sourceId,
		archivePath: firstRecord.archivePath,
		mediaType: firstRecord.mediaType,
		createdAt: firstRecord.createdAt,
	};
	const startedAt = new Date().toISOString();
	let operation: WikiOperationRecord = {
		id: operationId,
		type: 'save_analysis',
		status: 'executing',
		startedAt,
		updatedAt: startedAt,
		title,
		createdPages: 0,
		updatedPages: 0,
		claimsAdded: 0,
		contradictionsDetected: 0,
		validationErrors: [],
		reviewStatus: 'not_required',
	};
	repository.operations.store = {
		...repository.operations.store,
		operations: { ...repository.operations.store.operations, [operationId]: operation },
	};
	const update: WikiUpdate = {
		pages: [
			{
				path: pagePath,
				title,
				summary,
				content,
				pageType: input.pageType,
				sources: records.flatMap((record) => record!.relativePaths),
				sourceIds,
				tags: input.tags ?? [],
				aliases: input.aliases ?? [],
				related: input.related ?? [],
				claims: input.claims ?? [],
				openQuestions: input.openQuestions ?? [],
			},
		],
	};
	const applied = await transactWiki({
		targetPath: settings.targetPath,
		operationId,
		repository,
		apply: async (stagedPath) => {
			const result = await applyWikiUpdate(stagedPath, source, update, {
				operationId,
				requireReviewForMajorChanges: settings.requireReviewForMajorChanges,
				repository,
			});
			await rebuildWikiIndex(stagedPath);
			await appendWikiLog(stagedPath, source, result, operationId, 'saved_query', title);
			return result;
		},
	});
	if (applied.reviewItems?.length) {
		const ids = new Set(applied.reviewItems.map((item) => item.id));
		repository.reviews.store = {
			version: 1,
			items: [
				...repository.reviews.store.items.filter((item) => !ids.has(item.id)),
				...applied.reviewItems,
			],
		};
	}
	operation = {
		...operation,
		status: applied.pendingReviews ? 'awaiting_review' : 'completed',
		updatedAt: new Date().toISOString(),
		createdPages: applied.createdPages,
		updatedPages: applied.updatedPages,
		claimsAdded: applied.claimsAdded ?? 0,
		contradictionsDetected: applied.contradictionsDetected ?? 0,
		reviewStatus: applied.pendingReviews ? 'required' : 'not_required',
	};
	repository.operations.store = {
		...repository.operations.store,
		operations: { ...repository.operations.store.operations, [operationId]: operation },
	};
	return {
		operationId,
		path: pagePath,
		created: applied.createdPages > 0,
		updated: applied.updatedPages > 0,
		status: applied.pendingReviews ? 'awaiting_review' : 'completed',
		reviewIds: applied.reviewItems?.map((item) => item.id) ?? [],
	};
}
