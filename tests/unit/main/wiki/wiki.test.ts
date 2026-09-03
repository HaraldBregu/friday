import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';
import { applyWikiUpdate } from '../../../../src/main/agent/knowledge/wiki/wiki_apply_update';
import { collectWikiSources } from '../../../../src/main/agent/knowledge/wiki/wiki_collect_sources';
import { rebuildWikiIndex } from '../../../../src/main/agent/knowledge/wiki/wiki_index';
import { appendWikiLog } from '../../../../src/main/agent/knowledge/wiki/wiki_log';
import { normalizeWikiSettings } from '../../../../src/main/agent/knowledge/wiki/wiki_normalize_settings';
import { parseWikiUpdate } from '../../../../src/main/agent/knowledge/wiki/wiki_parse_update';
import { ensureWikiSchema } from '../../../../src/main/agent/knowledge/wiki/wiki_schema';
import { wikiSourcePage } from '../../../../src/main/agent/knowledge/wiki/wiki_source_page';
import type { WikiSource } from '../../../../src/main/agent/knowledge/wiki/types';
import { MAX_WIKI_SOURCE_BYTES } from '../../../../src/main/agent/knowledge/wiki/wiki_source_limits';
import { wikiSettingsStore } from '../../../../src/main/agent/knowledge/wiki/wiki_settings_store';

describe('wiki settings', () => {
	it('stores settings at settings/wiki.json with a wiki/data default target', () => {
		expect(wikiSettingsStore.path).toMatch(/[\\/]settings[\\/]wiki\.json$/);
		expect(wikiSettingsStore.store.targetPath).toMatch(/[\\/]wiki[\\/]data$/);
	});

	it('normalizes valid settings and rejects invalid or nested locations', () => {
		const settings = normalizeWikiSettings({
			providerId: ' openai ',
			modelId: ' gpt-5 ',
			sourcePath: '/tmp/wiki-raw',
			targetPath: '/tmp/wiki-data',
			schedule: { enabled: true, cronExpression: ' 0  3 * * * ' },
		});
		expect(settings).toMatchObject({
			providerId: 'openai',
			modelId: 'gpt-5',
			schedule: { enabled: true, cronExpression: '0 3 * * *' },
		});
		expect(() =>
			normalizeWikiSettings({
				...settings,
				schedule: { enabled: true, cronExpression: 'not cron' },
			})
		).toThrow('valid cron expression');
		expect(() =>
			normalizeWikiSettings({
				...settings,
				targetPath: path.join(settings.sourcePath, 'data'),
			})
		).toThrow('separate, non-nested');
	});
});

describe('wiki source ingestion', () => {
	it('collects supported text files and keeps source page names stable across content changes', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-source-'));
		await writeFile(path.join(root, 'notes.md'), '# Notes', 'utf8');
		await writeFile(path.join(root, 'ignored.bin'), 'binary', 'utf8');
		const sources = await collectWikiSources(root);
		expect(sources).toHaveLength(1);
		expect(sources[0]).toMatchObject({ relativePath: 'notes.md', content: '# Notes' });

		const firstPage = wikiSourcePage(sources[0]);
		const changed = { ...sources[0], content: 'changed', hash: 'different' };
		expect(wikiSourcePage(changed)).toBe(firstPage);
	});

	it('rejects source symlinks that escape the configured folder', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-symlink-'));
		const inbox = path.join(root, 'inbox');
		const outside = path.join(root, 'outside.md');
		await mkdir(inbox);
		await writeFile(outside, 'outside', 'utf8');
		await symlink(outside, path.join(inbox, 'linked.md'));

		await expect(collectWikiSources(inbox)).rejects.toThrow(
			'symlink outside the configured wiki folder'
		);
	});

	it('rejects oversized sources instead of truncating them', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-oversized-'));
		await writeFile(path.join(root, 'large.md'), Buffer.alloc(MAX_WIKI_SOURCE_BYTES + 1, 97));

		await expect(collectWikiSources(root)).rejects.toThrow('Refusing to ingest oversized source');
	});

	it('validates model updates and rejects traversal or missing source summaries', () => {
		const sourcePage = 'sources/notes-a1b2c3d4.md';
		const update = parseWikiUpdate(
			{
				pages: [
					{
						path: sourcePage,
						title: 'Notes',
						summary: 'A source summary.',
						content: 'Key facts.',
						sources: ['notes.md'],
					},
				],
			},
			sourcePage
		);
		expect(update.pages[0].path).toBe(sourcePage);
		expect(() =>
			parseWikiUpdate(
				{
					pages: [
						{
							path: '../outside.md',
							title: 'Unsafe',
							summary: 'Unsafe path.',
							content: 'No.',
							sources: [],
						},
					],
				},
				sourcePage
			)
		).toThrow('Unsafe wiki page path');
	});

	it('writes generated pages, schema, index and append-only log artifacts', async () => {
		const target = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-target-'));
		const source: WikiSource = {
			absolutePath: '/tmp/raw/notes.md',
			relativePath: 'notes.md',
			content: 'Kucedr is a desktop assistant.',
			hash: 'abc123',
		};
		const sourcePage = wikiSourcePage(source);
		await ensureWikiSchema(target);
		const applied = await applyWikiUpdate(target, source, {
			pages: [
				{
					path: sourcePage,
					title: 'Kucedr notes',
					summary: 'Notes about Kucedr.',
					content: 'Kucedr connects to [[Desktop assistants]].',
					sources: ['notes.md'],
				},
				{
					path: 'concepts/desktop-assistants.md',
					title: 'Desktop assistants',
					summary: 'Assistants integrated with desktop workflows.',
					content: 'Connected from [[Kucedr notes]].',
					sources: ['notes.md'],
				},
			],
		});
		await rebuildWikiIndex(target);
		await appendWikiLog(target, source, applied);

		expect(applied).toEqual({ createdPages: 2, updatedPages: 0 });
		const sourceMarkdown = matter(await readFile(path.join(target, sourcePage), 'utf8'));
		expect(sourceMarkdown.data.sources).toEqual(['notes.md']);
		expect(sourceMarkdown.content).toContain('[[Desktop assistants]]');
		expect(await readFile(path.join(target, 'AGENTS.md'), 'utf8')).toContain(
			'Wiki maintainer schema'
		);
		expect(await readFile(path.join(target, 'index.md'), 'utf8')).toContain(
			'[[concepts/desktop-assistants|Desktop assistants]]'
		);
		expect(await readFile(path.join(target, 'log.md'), 'utf8')).toContain('ingest | notes.md');
	});
});
