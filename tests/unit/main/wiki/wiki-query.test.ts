import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';
import { applyWikiUpdate } from '../../../../src/main/agent/knowledge/wiki/wiki_apply_update';
import { buildWikiAnswerContext } from '../../../../src/main/agent/knowledge/wiki/wiki_answer_context';
import { getWikiRepository } from '../../../../src/main/agent/knowledge/wiki/wiki_repository';
import { readWikiPage } from '../../../../src/main/agent/knowledge/wiki/wiki_read_page';
import { searchWiki } from '../../../../src/main/agent/knowledge/wiki/wiki_search';
import type { WikiSource } from '../../../../src/main/agent/knowledge/wiki/types';

const source: WikiSource = {
	absolutePath: '/tmp/raw/memory.md',
	relativePath: 'memory.md',
	content: 'Compiled knowledge should be searched before raw evidence.',
	hash: createHash('sha256')
		.update('Compiled knowledge should be searched before raw evidence.')
		.digest('hex'),
	sourceId: 'source-cccccccccccccccc',
};

describe('wiki-first query retrieval', () => {
	it('prioritizes exact aliases, traverses related pages, and separates raw evidence', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-query-'));
		const target = path.join(root, 'wiki');
		const repository = getWikiRepository(target);
		await mkdir(repository.paths.evidence, { recursive: true });
		const archive = path.join(repository.paths.evidence, 'memory.md');
		await writeFile(archive, source.content, 'utf8');
		repository.sources.store = {
			version: 1,
			sources: {
				[source.sourceId!]: {
					sourceId: source.sourceId!,
					checksum: source.hash,
					originalName: 'memory.md',
					relativePaths: ['memory.md'],
					mediaType: 'text/markdown',
					createdAt: '2026-08-06T00:00:00.000Z',
					ingestedAt: '2026-08-06T00:00:00.000Z',
					archivePath: archive,
					status: 'integrated',
				},
			},
		};
		await applyWikiUpdate(target, source, {
			pages: [
				{
					path: 'concepts/agent-memory.md',
					title: 'Agent memory',
					aliases: ['Persistent memory'],
					summary: 'How assistants retain durable compiled knowledge.',
					content: 'Compiled pages are queried before [[Knowledge retrieval]].',
					sources: ['memory.md'],
					claims: [
						{
							id: 'claim-wiki-first',
							statement: 'Compiled pages are queried before raw evidence.',
							evidence: [
								{ sourceId: source.sourceId!, locator: 'Paragraph 1', evidenceType: 'direct' },
							],
							confidence: 'high',
							status: 'supported',
						},
					],
				},
				{
					path: 'concepts/knowledge-retrieval.md',
					title: 'Knowledge retrieval',
					summary: 'Retrieval order and evidence fallback.',
					content: 'Retrieval distinguishes synthesis from evidence.',
					sources: ['memory.md'],
				},
			],
		});

		const results = await searchWiki('Persistent memory', 5, target);
		expect(results[0]).toMatchObject({ title: 'Agent memory', confidence: 0.98 });
		expect(results.some((result) => result.title === 'Knowledge retrieval')).toBe(true);
		expect(await readWikiPage('Agent memory', target)).toMatchObject({
			contentType: 'wiki_page',
			sourceIds: [source.sourceId],
		});

		const compiledOnly = await buildWikiAnswerContext('Persistent memory', false, target);
		expect(compiledOnly.compiledWiki[0].title).toBe('Agent memory');
		expect(compiledOnly.primaryEvidence).toEqual([]);

		const grounded = await buildWikiAnswerContext('compiled knowledge', true, target);
		expect(grounded.compiledWiki.length).toBeGreaterThan(0);
		expect(grounded.primaryEvidence[0]).toMatchObject({
			contentType: 'raw_source',
			sourceId: source.sourceId,
			locator: 'memory.md',
		});
	});

	it('returns only active compiled pages with usable review state', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-query-filter-'));
		const target = path.join(root, 'wiki');
		await applyWikiUpdate(target, source, {
			pages: [
				{
					path: 'visible.md',
					title: 'Visible marker',
					summary: 'Filter marker visible.',
					content: 'Filter marker visible.',
					sources: ['memory.md'],
				},
				{
					path: 'draft.md',
					title: 'Draft marker',
					summary: 'Filter marker draft.',
					content: 'Filter marker draft.',
					sources: ['memory.md'],
					status: 'draft',
				},
				{
					path: 'pending.md',
					title: 'Pending marker',
					summary: 'Filter marker pending.',
					content: 'Filter marker pending.',
					sources: ['memory.md'],
				},
			],
		});
		const pendingPath = path.join(target, 'pending.md');
		const pending = matter(await readFile(pendingPath, 'utf8'));
		await writeFile(
			pendingPath,
			matter.stringify(pending.content, { ...pending.data, review_status: 'pending' }),
			'utf8'
		);

		const results = await searchWiki('filter marker', 10, target);
		expect(results.map((result) => result.title)).toEqual(['Visible marker']);
	});
});
