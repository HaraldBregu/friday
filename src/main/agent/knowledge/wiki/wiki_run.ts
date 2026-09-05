import { mkdir } from 'node:fs/promises';
import type { WikiRunResult } from '../../../../shared/wiki_types';
import { applyWikiUpdate } from './wiki_apply_update';
import { collectWikiSources } from './wiki_collect_sources';
import { buildWikiContext } from './wiki_context';
import { generateWikiUpdate } from './wiki_generate';
import { getWikiSettings } from './wiki_get_settings';
import { getWikiState } from './wiki_get_state';
import { rebuildWikiIndex } from './wiki_index';
import { appendWikiLog } from './wiki_log';
import { wikiRuntime } from './wiki_runtime';
import { ensureWikiSchema } from './wiki_schema';
import { saveWikiState } from './wiki_save_state';
import { registerWikiSource } from './wiki_register_source';
import { getWikiRepository } from './wiki_repository';
import { transactWiki } from './wiki_transaction';
import type { WikiOperationRecord } from './types';
import { incrementWikiMetric } from './wiki_metrics';
import { commitWikiSourceLineage } from './wiki_commit_lineage';
import { markStaleWikiClaims } from './wiki_mark_stale_claims';

export async function runWiki(
	relativePath?: string,
	signal?: AbortSignal
): Promise<WikiRunResult> {
	if (wikiRuntime.run) return wikiRuntime.run;
	signal?.throwIfAborted();
	const controller = new AbortController();
	const runSignal = signal ? AbortSignal.any([controller.signal, signal]) : controller.signal;
	const runStartedAt = new Date().toISOString();
	wikiRuntime.controller = controller;

	wikiRuntime.run = (async () => {
		const settings = getWikiSettings();
		if (settings.enabled !== true) {
			return {
				processedSources: 0,
				skippedSources: 0,
				createdPages: 0,
				updatedPages: 0,
				completedAt: new Date().toISOString(),
			};
		}
		if (!settings.providerId || !settings.modelId) {
			throw new Error('Select a wiki provider and model before running.');
		}
		wikiRuntime.logger?.info('Wiki', 'Wiki ingest started');
		await mkdir(settings.sourcePath, { recursive: true, mode: 0o700 });
		const repository = getWikiRepository(settings.targetPath);
		const paths = repository.paths;
		await ensureWikiSchema(settings.targetPath, paths.config, false);
		runSignal.throwIfAborted();
		const discoveredSources = await collectWikiSources(settings.sourcePath, runSignal);
		const selectedPath = relativePath?.trim().replaceAll('\\', '/').replace(/^\.\//, '');
		const sources = selectedPath
			? discoveredSources.filter((source) => source.relativePath === selectedPath)
			: discoveredSources;
		if (sources.length === 0) {
			throw new Error(
				selectedPath
					? `No supported source document found at ${selectedPath}.`
					: `No supported source documents found in ${settings.sourcePath}.`
			);
		}

		const state = getWikiState(settings.targetPath);
		let createdPages = 0;
		let updatedPages = 0;
		const operationIds: string[] = [];
		let processedSources = 0;
		let skippedSources = 0;
		let claimsAdded = 0;
		let contradictionsDetected = 0;
		let pendingReviews = 0;

		for (const [sourceIndex, discovered] of sources.entries()) {
			runSignal.throwIfAborted();
			wikiRuntime.progress = {
				phase: 'preparing',
				currentSource: sourceIndex + 1,
				totalSources: sources.length,
				source: discovered.relativePath,
				startedAt: runStartedAt,
			};
			const operationId = `operation-ingest-${discovered.hash.slice(0, 16)}`;
			const registered = await registerWikiSource(
				discovered,
				operationId,
				repository,
				runSignal
			);
			const source = registered.source;
			if (
				!registered.isNew &&
				registered.record.status === 'integrated' &&
				!registered.pendingLineage
			) {
				state.sources[source.relativePath] = source.hash;
				skippedSources += 1;
				continue;
			}
			if (registered.isNew && state.sources[source.relativePath] === source.hash) {
				const registry = repository.sources.store;
				registry.sources[registered.record.sourceId] = {
					...registered.record,
					status: 'integrated',
				};
				repository.sources.store = registry;
				skippedSources += 1;
				continue;
			}

			const startedAt = new Date().toISOString();
			let operation: WikiOperationRecord = {
				id: operationId,
				type: 'ingest',
				status: 'planning',
				startedAt,
				updatedAt: startedAt,
				sourceId: registered.record.sourceId,
				title: source.relativePath,
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

			try {
				runSignal.throwIfAborted();
				const context = await buildWikiContext(settings.targetPath, source, runSignal);
				operation = { ...operation, status: 'executing', updatedAt: new Date().toISOString() };
				repository.operations.store = {
					...repository.operations.store,
					operations: { ...repository.operations.store.operations, [operationId]: operation },
				};
				wikiRuntime.progress = { ...wikiRuntime.progress, phase: 'generating' };
				const update = await generateWikiUpdate(settings, source, context, runSignal);
				runSignal.throwIfAborted();
				wikiRuntime.progress = { ...wikiRuntime.progress, phase: 'writing' };
				const applied = await transactWiki({
					targetPath: settings.targetPath,
					operationId,
					repository,
					signal: runSignal,
					apply: async (stagedPath) => {
						runSignal.throwIfAborted();
						await ensureWikiSchema(stagedPath, paths.config);
						runSignal.throwIfAborted();
						await markStaleWikiClaims(
							stagedPath,
							registered.pendingLineage ? [registered.pendingLineage.previousSourceId] : [],
							runSignal
						);
						runSignal.throwIfAborted();
						const result = await applyWikiUpdate(stagedPath, source, update, {
							operationId,
							requireReviewForMajorChanges: settings.requireReviewForMajorChanges,
							repository,
							signal: runSignal,
						});
						runSignal.throwIfAborted();
						await rebuildWikiIndex(stagedPath);
						runSignal.throwIfAborted();
						await appendWikiLog(stagedPath, source, result, operationId);
						return result;
					},
				});
				commitWikiSourceLineage(registered, repository);
				const registry = repository.sources.store;
				registry.sources[registered.record.sourceId] = {
					...registry.sources[registered.record.sourceId],
					status: 'integrated',
					operationId,
				};
				repository.sources.store = registry;
				state.sources[source.relativePath] = source.hash;
				createdPages += applied.createdPages;
				updatedPages += applied.updatedPages;
				claimsAdded += applied.claimsAdded ?? 0;
				contradictionsDetected += applied.contradictionsDetected ?? 0;
				pendingReviews += applied.pendingReviews ?? 0;
				if (applied.reviewItems?.length) {
					const current = repository.reviews.store.items;
					const ids = new Set(applied.reviewItems.map((item) => item.id));
					repository.reviews.store = {
						version: 1,
						items: [...current.filter((item) => !ids.has(item.id)), ...applied.reviewItems],
					};
				}
				processedSources += 1;
				operationIds.push(operationId);
				operation = {
					...operation,
					status: applied.pendingReviews ? 'awaiting_review' : 'completed',
					updatedAt: new Date().toISOString(),
					createdPages: applied.createdPages,
					updatedPages: applied.updatedPages,
					claimsAdded: applied.claimsAdded ?? 0,
					contradictionsDetected: applied.contradictionsDetected ?? 0,
					reviewStatus: applied.pendingReviews ? 'required' : 'not_required',
					modelUsage: update.modelUsage,
				};
				repository.operations.store = {
					...repository.operations.store,
					operations: { ...repository.operations.store.operations, [operationId]: operation },
				};
				saveWikiState(state, settings.targetPath);
				incrementWikiMetric('wiki_ingest_total');
				incrementWikiMetric('wiki_pages_created_total', applied.createdPages);
				incrementWikiMetric('wiki_pages_updated_total', applied.updatedPages);
				incrementWikiMetric('wiki_claims_added_total', applied.claimsAdded ?? 0);
				incrementWikiMetric(
					'wiki_contradictions_detected_total',
					applied.contradictionsDetected ?? 0
				);
				incrementWikiMetric('wiki_review_pending_total', applied.pendingReviews ?? 0);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				operation = {
					...operation,
					status: 'rolled_back',
					updatedAt: new Date().toISOString(),
					error: message,
				};
				repository.operations.store = {
					...repository.operations.store,
					operations: { ...repository.operations.store.operations, [operationId]: operation },
				};
				const failures = repository.failures.store.operations.filter(
					(item) => item.id !== operationId
				);
				repository.failures.store = { version: 1, operations: [...failures, operation] };
				const registry = repository.sources.store;
				registry.sources[registered.record.sourceId] = {
					...registry.sources[registered.record.sourceId],
					status: 'failed',
					operationId,
				};
				repository.sources.store = registry;
				incrementWikiMetric('wiki_ingest_failed_total');
				incrementWikiMetric('wiki_rollback_total');
				wikiRuntime.logger?.error('Wiki', 'Wiki ingest rolled back', {
					operationId,
					sourceId: registered.record.sourceId,
					error: message,
				});
				throw error;
			}
		}

		runSignal.throwIfAborted();
		if (processedSources === 0) await rebuildWikiIndex(settings.targetPath);
		runSignal.throwIfAborted();
		const result: WikiRunResult = {
			processedSources,
			skippedSources,
			createdPages,
			updatedPages,
			completedAt: new Date().toISOString(),
			operationIds,
			claimsAdded,
			contradictionsDetected,
			pendingReviews,
		};
		state.lastRun = result;
		saveWikiState(state, settings.targetPath);
		wikiRuntime.lastRun = result;
		wikiRuntime.logger?.info('Wiki', 'Wiki ingest completed', {
			processedSources,
			skippedSources,
			createdPages,
			updatedPages,
			claimsAdded,
			contradictionsDetected,
			pendingReviews,
			operationIds,
		});
		return result;
	})();

	try {
		return await wikiRuntime.run;
	} finally {
		wikiRuntime.run = undefined;
		wikiRuntime.controller = undefined;
		wikiRuntime.progress = undefined;
	}
}
