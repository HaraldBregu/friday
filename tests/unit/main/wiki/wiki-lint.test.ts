import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';
import { lintWiki } from '../../../../src/main/agent/knowledge/wiki/wiki_lint';
import { getWikiRepository } from '../../../../src/main/agent/knowledge/wiki/wiki_repository';

describe('wiki lint', () => {
	it('reports structural and provenance findings and safely rebuilds a drifted index', async () => {
		const target = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-lint-'));
		const repository = getWikiRepository(target);
		await import('node:fs/promises').then(({ mkdir }) =>
			mkdir(path.join(target, 'concepts'), { recursive: true })
		);
		await writeFile(
			path.join(target, 'concepts/example.md'),
			matter.stringify('# Example\n\nSee [[Missing concept]].\n', {
				id: 'concept-example',
				title: 'Example',
				page_type: 'concept',
				status: 'active',
				summary: 'Example page.',
				created_at: '2026-08-06T00:00:00.000Z',
				updated_at: '2026-08-06T00:00:00.000Z',
				source_ids: ['source-missing'],
				confidence: 'medium',
				review_status: 'auto_generated',
				claims: [
					{
						id: 'claim-example',
						statement: 'An example claim.',
						evidence: [
							{ sourceId: 'source-missing', locator: 'Paragraph 1', evidenceType: 'direct' },
						],
						confidence: 'medium',
						status: 'supported',
					},
				],
			}),
			'utf8'
		);

		const findings = await lintWiki(false, target);
		expect(findings.critical.map((finding) => finding.code)).toEqual(
			expect.arrayContaining(['broken_link', 'invalid_source_reference'])
		);
		expect(findings.warnings.map((finding) => finding.code)).toContain('orphan_page');
		expect(findings.autoFixable.map((finding) => finding.code)).toContain('index_drift');

		const repaired = await lintWiki(true, target);
		expect(repaired.fixed).toBe(1);
		expect(await readFile(path.join(target, 'index.md'), 'utf8')).toContain(
			'[[concepts/example|Example]]'
		);
		expect(await readFile(path.join(target, 'log.md'), 'utf8')).toContain(
			'lint | Wiki integrity check'
		);
		expect(repository.manifest.store.pages['concept-example']).toMatchObject({
			path: 'concepts/example.md',
			pageType: 'concept',
		});
	});
});
