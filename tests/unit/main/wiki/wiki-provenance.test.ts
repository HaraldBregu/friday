import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';

jest.mock('../../../../src/main/agent/knowledge/wiki/wiki_location', () => ({
	wikiLocation: () => '/tmp/kucedr-wiki-provenance-data',
}));

import { applyWikiUpdate } from '../../../../src/main/agent/knowledge/wiki/wiki_apply_update';
import { buildWikiAnswerContext } from '../../../../src/main/agent/knowledge/wiki/wiki_answer_context';
import { commitWikiSourceLineage } from '../../../../src/main/agent/knowledge/wiki/wiki_commit_lineage';
import { lintWiki } from '../../../../src/main/agent/knowledge/wiki/wiki_lint';
import { markStaleWikiClaims } from '../../../../src/main/agent/knowledge/wiki/wiki_mark_stale_claims';
import { registerWikiSource } from '../../../../src/main/agent/knowledge/wiki/wiki_register_source';
import { getWikiRepository } from '../../../../src/main/agent/knowledge/wiki/wiki_repository';
import { searchWiki } from '../../../../src/main/agent/knowledge/wiki/wiki_search';
import { transactWiki } from '../../../../src/main/agent/knowledge/wiki/wiki_transaction';
import type { WikiSource } from '../../../../src/main/agent/knowledge/wiki/types';
import { validateWiki } from '../../../../src/main/agent/knowledge/wiki/wiki_validate';
import { verifyWikiEvidence } from '../../../../src/main/agent/knowledge/wiki/wiki_verify_evidence';

describe('wiki evidence provenance', () => {
	it('computes excerpt hashes and rejects locator, hash, and archive tampering durably', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-provenance-'));
		const target = path.join(root, 'wiki');
		const archive = path.join(root, 'evidence.md');
		const content = '# Evidence\nKucedr stores durable facts.\nA final line.\n';
		const checksum = createHash('sha256').update(content).digest('hex');
		const source: WikiSource = {
			absolutePath: archive,
			relativePath: 'evidence.md',
			content,
			hash: checksum,
			sourceId: `source-${checksum.slice(0, 16)}`,
			archivePath: archive,
		};
		const repository = getWikiRepository(target);
		await writeFile(archive, content, 'utf8');
		repository.sources.store = {
			version: 1,
			sources: {
				[source.sourceId!]: {
					sourceId: source.sourceId!,
					checksum,
					originalName: 'evidence.md',
					relativePaths: ['evidence.md'],
					mediaType: 'text/markdown',
					createdAt: '2026-08-09T00:00:00.000Z',
					ingestedAt: '2026-08-09T00:00:00.000Z',
					archivePath: archive,
					status: 'integrated',
				},
			},
		};

		const verified = await verifyWikiEvidence(
			{ sourceId: source.sourceId!, locator: 'line 2', evidenceType: 'direct' },
			repository
		);
		expect(verified).toEqual({
			sourceId: source.sourceId,
			locator: 'lines 2-2',
			evidenceType: 'direct',
			excerptHash: createHash('sha256').update('Kucedr stores durable facts.').digest('hex'),
		});
		await expect(
			verifyWikiEvidence(
				{ sourceId: source.sourceId!, locator: 'lines 20-21', evidenceType: 'direct' },
				repository
			)
		).rejects.toThrow('outside the archived source');
		await expect(
			verifyWikiEvidence({ ...verified, excerptHash: '0'.repeat(64) }, repository)
		).rejects.toThrow('excerpt hash mismatch');

		await applyWikiUpdate(
			target,
			source,
			{
				pages: [
					{
						path: 'facts.md',
						title: 'Durable facts',
						summary: 'Verified source-backed facts.',
						content: 'Kucedr stores durable facts.',
						sources: ['evidence.md'],
						claims: [
							{
								id: 'claim-durable',
								statement: 'Kucedr stores durable facts.',
								evidence: [
									{
										sourceId: source.sourceId!,
										locator: 'lines 2-2',
										evidenceType: 'direct',
									},
								],
								confidence: 'high',
								status: 'supported',
							},
						],
					},
				],
			},
			{ repository }
		);
		const pagePath = path.join(target, 'facts.md');
		const parsed = matter(await readFile(pagePath, 'utf8'));
		parsed.data.claims[0].evidence[0].excerptHash = 'f'.repeat(64);
		await writeFile(pagePath, matter.stringify(parsed.content, parsed.data), 'utf8');

		expect(await validateWiki(target, repository)).toContain(
			"Invalid evidence for claim 'claim-durable' in facts.md"
		);
		expect(await searchWiki('durable facts', 5, target)).toEqual([]);
		const context = await buildWikiAnswerContext('durable facts', false, target);
		expect(context.compiledWiki).toEqual([]);
		expect(context.limitations).toContain('No compiled wiki page matched the query.');
		const lint = await lintWiki(false, target);
		expect(lint.critical).toEqual(
			expect.arrayContaining([expect.objectContaining({ code: 'invalid_evidence' })])
		);

		await writeFile(archive, `${content}tampered`, 'utf8');
		await expect(verifyWikiEvidence(verified, repository)).rejects.toThrow(
			'Immutable source archive checksum mismatch'
		);
	});

	it('rolls back stale claims and publishes lineage only after a successful transaction', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-lineage-'));
		const target = path.join(root, 'wiki');
		const sourcePath = path.join(root, 'notes.md');
		const repository = getWikiRepository(target);
		const firstContent = 'Version one evidence.';
		await writeFile(sourcePath, firstContent, 'utf8');
		const first = await registerWikiSource(
			{
				absolutePath: sourcePath,
				relativePath: 'notes.md',
				content: firstContent,
				hash: createHash('sha256').update(firstContent).digest('hex'),
			},
			'operation-v1',
			repository
		);
		const registry = repository.sources.store;
		registry.sources[first.record.sourceId] = { ...first.record, status: 'integrated' };
		repository.sources.store = registry;
		await applyWikiUpdate(target, first.source, {
			pages: [
				{
					path: 'history.md',
					title: 'History',
					summary: 'Versioned claims.',
					content: 'Claims backed by versioned evidence.',
					sources: ['notes.md'],
					claims: [
						{
							id: 'claim-only-old',
							statement: 'Only the old source supports this.',
							evidence: [
								{ sourceId: first.record.sourceId, locator: 'Version one', evidenceType: 'direct' },
							],
							confidence: 'high',
							status: 'supported',
						},
						{
							id: 'claim-mixed',
							statement: 'Another source also supports this.',
							evidence: [
								{ sourceId: first.record.sourceId, locator: 'Version one', evidenceType: 'direct' },
								{ sourceId: 'source-other', locator: 'Other', evidenceType: 'indirect' },
							],
							confidence: 'medium',
							status: 'supported',
						},
					],
				},
			],
		});

		const secondContent = 'Version two evidence.';
		await writeFile(sourcePath, secondContent, 'utf8');
		const second = await registerWikiSource(
			{
				absolutePath: sourcePath,
				relativePath: 'notes.md',
				content: secondContent,
				hash: createHash('sha256').update(secondContent).digest('hex'),
			},
			'operation-v2',
			repository
		);
		expect(second.pendingLineage).toMatchObject({
			previousSourceId: first.record.sourceId,
			version: 2,
		});
		expect(repository.sources.store.sources[first.record.sourceId].lineage).toBeUndefined();

		await expect(
			transactWiki({
				targetPath: target,
				operationId: 'operation-failed-lineage',
				repository,
				apply: async (stagedPath) => {
					await markStaleWikiClaims(stagedPath, [first.record.sourceId]);
					throw new Error('validation failed');
				},
				validate: async () => [],
			})
		).rejects.toThrow('validation failed');
		let claims = matter(await readFile(path.join(target, 'history.md'), 'utf8')).data.claims;
		expect(claims.map((claim: { status: string }) => claim.status)).toEqual([
			'supported',
			'supported',
		]);
		expect(repository.sources.store.sources[first.record.sourceId].lineage).toBeUndefined();

		await transactWiki({
			targetPath: target,
			operationId: 'operation-successful-lineage',
			repository,
			apply: (stagedPath) => markStaleWikiClaims(stagedPath, [first.record.sourceId]),
			validate: async () => [],
		});
		commitWikiSourceLineage(second, repository);
		claims = matter(await readFile(path.join(target, 'history.md'), 'utf8')).data.claims;
		expect(claims.map((claim: { status: string }) => claim.status)).toEqual([
			'superseded',
			'disputed',
		]);
		expect(
			repository.sources.store.sources[first.record.sourceId].lineage?.['notes.md']
		).toMatchObject({ version: 1, replacedBySourceId: second.record.sourceId });
		expect(
			repository.sources.store.sources[second.record.sourceId].lineage?.['notes.md']
		).toMatchObject({ version: 2, previousSourceId: first.record.sourceId });
	});
});
