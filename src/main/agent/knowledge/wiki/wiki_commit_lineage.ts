import type { WikiRegisteredSource, WikiRepository } from './types';

export function commitWikiSourceLineage(
	registered: WikiRegisteredSource,
	repository: WikiRepository
): void {
	const pending = registered.pendingLineage;
	if (!pending) return;
	const registry = repository.sources.store;
	const previous = registry.sources[pending.previousSourceId];
	const current = registry.sources[registered.record.sourceId];
	if (!previous || !current) throw new Error('Cannot commit wiki source lineage without both versions.');
	registry.sources = {
		...registry.sources,
		[previous.sourceId]: {
			...previous,
			lineage: {
				...previous.lineage,
				[pending.relativePath]: {
					version: Math.max(1, pending.version - 1),
					...previous.lineage?.[pending.relativePath],
					replacedBySourceId: current.sourceId,
				},
			},
		},
		[current.sourceId]: {
			...current,
			lineage: {
				...current.lineage,
				[pending.relativePath]: {
					version: pending.version,
					previousSourceId: previous.sourceId,
				},
			},
		},
	};
	repository.sources.store = registry;
}
