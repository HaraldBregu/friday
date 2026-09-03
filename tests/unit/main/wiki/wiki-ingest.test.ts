import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

jest.mock('../../../../src/main/agent/knowledge/wiki/wiki_location', () => ({
	wikiLocation: () => '/tmp/kucedr-wiki-test-data',
}));

import { collectWikiSources } from '../../../../src/main/agent/knowledge/wiki/wiki_collect_sources';
import { registerWikiSource } from '../../../../src/main/agent/knowledge/wiki/wiki_register_source';
import { getWikiRepository } from '../../../../src/main/agent/knowledge/wiki/wiki_repository';

describe('immutable wiki source registration', () => {
	it('archives exact bytes without changing the source and deduplicates repeated ingest', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-ingest-'));
		const inbox = path.join(root, 'inbox');
		const repository = getWikiRepository(path.join(root, 'wiki'));
		await import('node:fs/promises').then(({ mkdir }) => mkdir(inbox, { recursive: true }));
		const sourcePath = path.join(inbox, 'notes.md');
		const original = Buffer.from('# Notes\n\nKucedr keeps durable knowledge.\n', 'utf8');
		await writeFile(sourcePath, original);
		const [source] = await collectWikiSources(inbox);

		const first = await registerWikiSource(source, 'operation-one', repository);
		const second = await registerWikiSource(source, 'operation-two', repository);

		expect(await readFile(sourcePath)).toEqual(original);
		expect(await readFile(first.record.archivePath)).toEqual(original);
		expect(first.record.sourceId).toMatch(/^source-[a-f0-9]{16}$/);
		expect(first.isNew).toBe(true);
		expect(second.isNew).toBe(false);
		expect(second.record.sourceId).toBe(first.record.sourceId);
		expect(Object.keys(repository.sources.store.sources)).toEqual([first.record.sourceId]);
	});

	it('rejects credential-like sources before creating a registry record', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-secret-'));
		const repository = getWikiRepository(path.join(root, 'wiki'));
		await writeFile(
			path.join(root, '.env'),
			'API_KEY=secret-value-that-must-not-be-stored',
			'utf8'
		);
		const source = {
			absolutePath: path.join(root, '.env'),
			relativePath: '.env',
			content: 'API_KEY=secret-value-that-must-not-be-stored',
			hash: 'a'.repeat(64),
		};

		await expect(
			registerWikiSource(source, 'operation-secret', repository)
		).rejects.toThrow('credential-like file');
		expect(repository.sources.store.sources).toEqual({});
	});

	it('scans the complete bytes that are eligible for immutable archival', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-full-scan-'));
		const repository = getWikiRepository(path.join(root, 'wiki'));
		const sourcePath = path.join(root, 'notes.md');
		const bytes = Buffer.from(`Safe prefix\n${'x'.repeat(4_000)}\npassword=abcdefghijklmnopqrstuvwxyz123456`);
		await writeFile(sourcePath, bytes);

		await expect(
			registerWikiSource(
				{
					absolutePath: sourcePath,
					relativePath: 'notes.md',
					content: 'Safe prefix',
					hash: createHash('sha256').update(bytes).digest('hex'),
				},
				'operation-full-scan',
				repository
			)
		).rejects.toThrow('credential-like content');
		expect(repository.sources.store.sources).toEqual({});
	});
});
