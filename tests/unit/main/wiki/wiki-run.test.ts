import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const generateWikiUpdate = jest.fn();

jest.mock('../../../../src/main/agent/knowledge/wiki/wiki_location', () => ({
	wikiLocation: () => '/tmp/kucedr-wiki-test-data',
}));

jest.mock('../../../../src/main/agent/knowledge/wiki/wiki_generate', () => ({
	generateWikiUpdate,
}));

import { runWiki } from '../../../../src/main/agent/knowledge/wiki/wiki_run';
import { cancelWiki } from '../../../../src/main/agent/knowledge/wiki/wiki_cancel';
import { wikiRuntime } from '../../../../src/main/agent/knowledge/wiki/wiki_runtime';
import { wikiSettingsStore } from '../../../../src/main/agent/knowledge/wiki/wiki_settings_store';
import { wikiSourcePage } from '../../../../src/main/agent/knowledge/wiki/wiki_source_page';
import { getWikiRepository } from '../../../../src/main/agent/knowledge/wiki/wiki_repository';

describe('runWiki', () => {
	beforeEach(() => {
		generateWikiUpdate.mockReset();
		wikiRuntime.run = undefined;
		wikiRuntime.lastRun = undefined;
		wikiRuntime.controller = undefined;
		wikiRuntime.progress = undefined;
	});

	it('processes changed sources, skips unchanged sources and updates stable pages', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-run-'));
		const sourcePath = path.join(root, 'raw');
		const targetPath = path.join(root, 'data');
		await import('node:fs/promises').then(({ mkdir }) => mkdir(sourcePath, { recursive: true }));
		await writeFile(path.join(sourcePath, 'notes.md'), 'Version one', 'utf8');
		wikiSettingsStore.store = {
			enabled: true,
			providerId: 'openai',
			modelId: 'gpt-5',
			sourcePath,
			targetPath,
			schedule: { enabled: false, cronExpression: '0 3 * * *' },
		};
		wikiRuntime.run = undefined;
		wikiRuntime.lastRun = undefined;
		generateWikiUpdate.mockImplementation(async (_settings, source) => ({
			pages: [
				{
					path: wikiSourcePage(source),
					title: 'Notes',
					summary: 'Incremental notes.',
					content: `Compiled ${source.content}.`,
					sources: [source.relativePath],
				},
			],
		}));

		const first = await runWiki();
		const second = await runWiki();
		await writeFile(path.join(sourcePath, 'notes.md'), 'Version two', 'utf8');
		const third = await runWiki();

		expect(first).toMatchObject({ processedSources: 1, skippedSources: 0, createdPages: 1 });
		expect(second).toMatchObject({ processedSources: 0, skippedSources: 1 });
		expect(third).toMatchObject({ processedSources: 1, skippedSources: 0, updatedPages: 1 });
		expect(generateWikiUpdate).toHaveBeenCalledTimes(2);
		const sourcePage = wikiSourcePage({
			absolutePath: path.join(sourcePath, 'notes.md'),
			relativePath: 'notes.md',
			content: '',
			hash: '',
		});
		expect(await readFile(path.join(targetPath, sourcePage), 'utf8')).toContain(
			'Compiled Version two.'
		);
		const log = await readFile(path.join(targetPath, 'log.md'), 'utf8');
		expect(log.match(/ingest \| notes\.md/g)).toHaveLength(2);
	});

	it('rolls back an invalid generated change and records the failed operation', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-failure-'));
		const sourcePath = path.join(root, 'raw');
		const targetPath = path.join(root, 'data');
		const repository = getWikiRepository(targetPath);
		await import('node:fs/promises').then(({ mkdir }) =>
			Promise.all([mkdir(sourcePath, { recursive: true }), mkdir(targetPath, { recursive: true })])
		);
		await writeFile(path.join(sourcePath, 'invalid.md'), 'Invalid generated link', 'utf8');
		await writeFile(path.join(targetPath, 'index.md'), '# Original index\n', 'utf8');
		wikiSettingsStore.store = {
			enabled: true,
			providerId: 'openai',
			modelId: 'gpt-5',
			sourcePath,
			targetPath,
			schedule: { enabled: false, cronExpression: '0 3 * * *' },
		} as never;
		generateWikiUpdate.mockImplementation(async (_settings, source) => ({
			pages: [
				{
					path: wikiSourcePage(source),
					title: 'Invalid',
					summary: 'Contains a broken link.',
					content: 'See [[Missing page]].',
					sources: [source.relativePath],
				},
			],
		}));

		await expect(runWiki()).rejects.toThrow('Broken link');
		expect(await readFile(path.join(targetPath, 'index.md'), 'utf8')).toBe('# Original index\n');
		await expect(readFile(path.join(targetPath, 'AGENTS.md'), 'utf8')).rejects.toMatchObject({
			code: 'ENOENT',
		});
		expect(Object.values(repository.operations.store.operations)[0]).toMatchObject({
			status: 'rolled_back',
		});
		expect(repository.failures.store.operations).toHaveLength(1);
	});

	it('returns without model or filesystem work when globally disabled', async () => {
		wikiSettingsStore.store = {
			providerId: '',
			modelId: '',
			sourcePath: '/unused/raw',
			targetPath: '/unused/data',
			enabled: false,
			schedule: { enabled: true, cronExpression: '0 3 * * *' },
		} as never;

		await expect(runWiki()).resolves.toMatchObject({
			processedSources: 0,
			skippedSources: 0,
			createdPages: 0,
			updatedPages: 0,
		});
		expect(generateWikiUpdate).not.toHaveBeenCalled();
	});

	it('reports source progress and cancels an in-flight model request', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-cancel-'));
		const sourcePath = path.join(root, 'raw');
		const targetPath = path.join(root, 'data');
		const repository = getWikiRepository(targetPath);
		await import('node:fs/promises').then(({ mkdir }) => mkdir(sourcePath, { recursive: true }));
		await writeFile(path.join(sourcePath, 'slow.md'), 'Slow source', 'utf8');
		wikiSettingsStore.store = {
			enabled: true,
			providerId: 'openai',
			modelId: 'gpt-5',
			sourcePath,
			targetPath,
			schedule: { enabled: false, cronExpression: '0 3 * * *' },
		} as never;
		let generationStarted: (() => void) | undefined;
		const started = new Promise<void>((resolve) => {
			generationStarted = resolve;
		});
		generateWikiUpdate.mockImplementation(
			async (_settings, _source, _context, signal: AbortSignal) =>
				new Promise((_resolve, reject) => {
					generationStarted?.();
					const abort = (): void => reject(new Error('aborted'));
					if (signal.aborted) abort();
					else signal.addEventListener('abort', abort, { once: true });
				})
		);

		const run = runWiki();
		await started;
		expect(wikiRuntime.progress).toMatchObject({
			phase: 'generating',
			currentSource: 1,
			totalSources: 1,
			source: 'slow.md',
		});
		expect(cancelWiki()).toBe(true);
		expect(wikiRuntime.progress?.phase).toBe('cancelling');
		await expect(run).rejects.toThrow('aborted');
		expect(wikiRuntime.run).toBeUndefined();
		expect(wikiRuntime.controller).toBeUndefined();
		expect(wikiRuntime.progress).toBeUndefined();
		expect(Object.values(repository.operations.store.operations)[0]).toMatchObject({
			status: 'rolled_back',
		});
	});

	it('propagates an external agent cancellation into the active model request', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-agent-cancel-'));
		const sourcePath = path.join(root, 'raw');
		const targetPath = path.join(root, 'data');
		await import('node:fs/promises').then(({ mkdir }) => mkdir(sourcePath, { recursive: true }));
		await writeFile(path.join(sourcePath, 'slow.md'), 'Slow source', 'utf8');
		wikiSettingsStore.store = {
			enabled: true,
			providerId: 'openai',
			modelId: 'gpt-5',
			sourcePath,
			targetPath,
			schedule: { enabled: false, cronExpression: '0 3 * * *' },
		} as never;
		let receivedSignal: AbortSignal | undefined;
		let generationStarted: (() => void) | undefined;
		const started = new Promise<void>((resolve) => {
			generationStarted = resolve;
		});
		generateWikiUpdate.mockImplementation(
			async (_settings, _source, _context, signal: AbortSignal) =>
				new Promise((_resolve, reject) => {
					receivedSignal = signal;
					generationStarted?.();
					signal.addEventListener('abort', () => reject(signal.reason), { once: true });
				})
		);
		const controller = new AbortController();
		const run = runWiki(undefined, controller.signal);
		await started;
		const reason = new Error('agent run cancelled');
		controller.abort(reason);

		await expect(run).rejects.toBe(reason);
		expect(receivedSignal?.aborted).toBe(true);
		expect(wikiRuntime.run).toBeUndefined();
	});
});
