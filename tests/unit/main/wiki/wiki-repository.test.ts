import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { wikiFailureStore } from '../../../../src/main/agent/knowledge/wiki/wiki_failure_store';
import { wikiLocation } from '../../../../src/main/agent/knowledge/wiki/wiki_location';
import { wikiManifestStore } from '../../../../src/main/agent/knowledge/wiki/wiki_manifest_store';
import { wikiOperationStore } from '../../../../src/main/agent/knowledge/wiki/wiki_operation_store';
import { getWikiRepository } from '../../../../src/main/agent/knowledge/wiki/wiki_repository';
import { wikiReviewStore } from '../../../../src/main/agent/knowledge/wiki/wiki_review_store';
import {
	DEFAULT_WIKI_SETTINGS,
} from '../../../../src/main/agent/knowledge/wiki/wiki_settings_store';
import { wikiSourceStore } from '../../../../src/main/agent/knowledge/wiki/wiki_source_store';
import { wikiStateStore } from '../../../../src/main/agent/knowledge/wiki/wiki_state_store';

describe('target-scoped wiki repository', () => {
	it('preserves every legacy store only for the default target', () => {
		const repository = getWikiRepository(DEFAULT_WIKI_SETTINGS.targetPath);

		expect(repository.sources).toBe(wikiSourceStore);
		expect(repository.reviews).toBe(wikiReviewStore);
		expect(repository.operations).toBe(wikiOperationStore);
		expect(repository.failures).toBe(wikiFailureStore);
		expect(repository.manifest).toBe(wikiManifestStore);
		expect(repository.state).toBe(wikiStateStore);
	});

	it('canonicalizes targets and isolates all state in app-owned paths', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-repositories-'));
		const firstTarget = path.join(root, 'first');
		const secondTarget = path.join(root, 'second');
		const first = getWikiRepository(firstTarget);
		const firstAlias = getWikiRepository(path.join(root, 'nested', '..', 'first'));
		const second = getWikiRepository(secondTarget);

		first.sources.store = { version: 1, sources: { source: {} as never } };
		first.reviews.store = { version: 1, items: [{} as never] };
		first.operations.store = { version: 1, operations: { operation: {} as never } };
		first.failures.store = { version: 1, operations: [{} as never] };
		first.manifest.store = { version: 1, pages: { page: {} as never } };
		first.state.store = { sources: { 'source.md': 'hash' } };

		expect(firstAlias).toBe(first);
		expect(second.sources.store.sources).toEqual({});
		expect(second.reviews.store.items).toEqual([]);
		expect(second.operations.store.operations).toEqual({});
		expect(second.failures.store.operations).toEqual([]);
		expect(second.manifest.store.pages).toEqual({});
		expect(second.state.store.sources).toEqual({});
		expect(path.relative(wikiLocation(), first.paths.root)).not.toMatch(/^\.\.(?:\/|$)/);
		expect(first.paths.root).not.toBe(path.dirname(firstTarget));
	});
});
