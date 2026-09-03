import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const getWikiRepository = jest.fn();

jest.mock('../../../../src/main/agent/knowledge/wiki', () => ({ getWikiRepository }));

import { DataController } from '../../../../src/main/data/data_controller';

it('exports and purges only manifest-owned pages and target-scoped wiki state', async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kucedr-data-wiki-'));
	const target = path.join(root, 'target');
	const state = path.join(root, 'managed', 'state');
	const evidence = path.join(root, 'managed', 'evidence');
	const config = path.join(root, 'managed', 'config');
	await fs.mkdir(path.join(target, 'pages'), { recursive: true });
	await fs.mkdir(state, { recursive: true });
	await fs.mkdir(evidence, { recursive: true });
	await fs.mkdir(config, { recursive: true });
	await fs.writeFile(path.join(target, 'pages', 'managed.md'), '# Managed\n');
	await fs.writeFile(path.join(target, 'unmanaged.md'), '# Keep\n');
	await fs.writeFile(path.join(evidence, 'source.txt'), 'Evidence\n');
	await fs.writeFile(path.join(state, 'source-registry.json'), '{"private":true}\n');
	const repository = {
		paths: { root, state, evidence, config },
		sources: { store: { version: 1, sources: { source: {} } } },
		reviews: { store: { version: 1, items: [{}] } },
		operations: { store: { version: 1, operations: { operation: {} } } },
		failures: { store: { version: 1, operations: [{}] } },
		manifest: {
			store: {
				version: 1,
				pages: { managed: { path: 'pages/managed.md' } },
			},
		},
		state: { store: { sources: { source: 'checksum' } } },
	};
	getWikiRepository.mockReturnValue(repository);
	const controller = new DataController({
		config: { location: path.join(root, 'workspace') },
		listSessions: () => [],
		deleteSession: jest.fn(),
	});
	const scope = { kind: 'wiki' as const, targetPath: target };
	const preview = await controller.previewPurge(scope);
	const exportPath = path.join(root, 'wiki-export.json');

	await controller.export(scope, exportPath);
	const archive = JSON.parse(await fs.readFile(exportPath, 'utf8'));
	expect(archive.files.map((file: { path: string }) => file.path)).toEqual(
		expect.arrayContaining(['wiki/pages/pages/managed.md', 'wiki/evidence/source.txt'])
	);
	await controller.purge(scope, preview.confirmationId);
	await expect(fs.stat(path.join(target, 'pages', 'managed.md'))).rejects.toMatchObject({
		code: 'ENOENT',
	});
	expect(await fs.readFile(path.join(target, 'unmanaged.md'), 'utf8')).toContain('Keep');
	expect(repository.manifest.store).toEqual({ version: 1, pages: {} });
	expect(repository.sources.store).toEqual({ version: 1, sources: {} });
	await expect(fs.stat(evidence)).rejects.toMatchObject({ code: 'ENOENT' });
	await fs.rm(root, { recursive: true, force: true });
});
