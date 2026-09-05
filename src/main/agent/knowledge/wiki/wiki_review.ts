import { readKnowledgeText } from '../read';
import { writeKnowledgeText } from '../write';
import matter from 'gray-matter';
import { applyWikiUpdate } from './wiki_apply_update';
import { getWikiSettings } from './wiki_get_settings';
import { rebuildWikiIndex } from './wiki_index';
import { appendWikiLog } from './wiki_log';
import { getWikiRepository } from './wiki_repository';
import { transactWiki } from './wiki_transaction';
import type { WikiOperationRecord, WikiReviewItem, WikiSource } from './types';

export async function reviewWikiChange(
	reviewId: string,
	action: 'approve' | 'reject'
): Promise<WikiReviewItem> {
	const settings = getWikiSettings();
	const repository = getWikiRepository(settings.targetPath);
	const item = repository.reviews.store.items.find((candidate) => candidate.id === reviewId);
	if (!item) throw new Error(`Wiki review item not found: ${reviewId}`);
	if (item.status !== 'pending') throw new Error(`Wiki review item is already ${item.status}.`);
	const record = item.evidenceSourceIds
		.map((id) => repository.sources.store.sources[id])
		.find(Boolean);
	const operationId = `operation-review-${reviewId.replace(/^review-/, '')}-${action}`;
	const source: WikiSource = record
		? {
				absolutePath: record.archivePath,
				relativePath: record.relativePaths[0] ?? record.originalName,
				content: '',
				hash: record.checksum,
				sourceId: record.sourceId,
				archivePath: record.archivePath,
			}
		: { absolutePath: '', relativePath: 'human review', content: '', hash: reviewId };
	const applied = await transactWiki({
		targetPath: settings.targetPath,
		operationId,
		repository,
		apply: async (stagedPath) => {
			const result =
				action === 'approve'
					? await applyWikiUpdate(stagedPath, source, item.proposedUpdate, {
							operationId,
							requireReviewForMajorChanges: false,
							allowContradictionResolution: true,
							repository,
						})
					: { createdPages: 0, updatedPages: 0 };
			if (action === 'approve') {
				for (const page of item.proposedUpdate.pages) {
					const parsed = matter(await readKnowledgeText(stagedPath, page.path));
					await writeKnowledgeText(
						stagedPath,
						page.path,
						matter.stringify(parsed.content, { ...parsed.data, review_status: 'approved' })
					);
				}
				await rebuildWikiIndex(stagedPath);
			}
			await appendWikiLog(
				stagedPath,
				source,
				result,
				operationId,
				'review',
				`${action} ${reviewId}`
			);
			return result;
		},
	});
	const reviewed = {
		...item,
		status: action === 'approve' ? ('approved' as const) : ('rejected' as const),
	};
	repository.reviews.store = {
		version: 1,
		items: repository.reviews.store.items.map((candidate) =>
			candidate.id === reviewId ? reviewed : candidate
		),
	};
	const original = repository.operations.store.operations[item.operationId];
	if (original) {
		repository.operations.store = {
			...repository.operations.store,
			operations: {
				...repository.operations.store.operations,
				[item.operationId]: {
					...original,
					status: 'completed',
					updatedAt: new Date().toISOString(),
					reviewStatus: action === 'approve' ? 'approved' : 'rejected',
				},
			},
		};
	}
	const now = new Date().toISOString();
	const operation: WikiOperationRecord = {
		id: operationId,
		type: 'review',
		status: 'completed',
		startedAt: now,
		updatedAt: now,
		title: `${action} ${reviewId}`,
		createdPages: applied.createdPages,
		updatedPages: applied.updatedPages,
		claimsAdded: applied.claimsAdded ?? 0,
		contradictionsDetected: applied.contradictionsDetected ?? 0,
		validationErrors: [],
		reviewStatus: action === 'approve' ? 'approved' : 'rejected',
	};
	repository.operations.store = {
		...repository.operations.store,
		operations: { ...repository.operations.store.operations, [operationId]: operation },
	};
	return reviewed;
}
