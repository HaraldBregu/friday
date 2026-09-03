import path from 'node:path';

const mkdirSync = jest.fn();
const readFileSync = jest.fn();
const renameSync = jest.fn();
const rmSync = jest.fn();
const writeFileSync = jest.fn();

jest.mock('node:fs', () => ({ mkdirSync, readFileSync, renameSync, rmSync, writeFileSync }));
jest.mock('../../../../src/main/shared/user_data_location', () => ({
	userDataLocation: () => '/user/data',
}));

import { readRagManifest, writeRagManifest } from '../../../../src/main/agent/knowledge/rag/rag_manifest';

const manifest = {
	indexName: 'kucedr',
	activeNamespace: 'kucedr-a1b2c3d4',
	artifactFile: 'embeddings-kucedr-a1b2c3d4.json',
	providerId: 'openai',
	modelId: 'text-embedding-3-small',
	dimensions: 1536,
	completedAt: '2026-08-08T00:00:00.000Z',
};

it('writes the RAG manifest to rag/index.json', () => {
	writeRagManifest(manifest);

	expect(mkdirSync).toHaveBeenCalledWith(path.join('/user/data', 'rag'), { recursive: true });
	const temporaryFile = writeFileSync.mock.calls[0][0] as string;
	expect(temporaryFile).toMatch(/index\.json\..+\.tmp$/);
	expect(writeFileSync).toHaveBeenCalledWith(temporaryFile, JSON.stringify(manifest), 'utf8');
	expect(renameSync).toHaveBeenCalledWith(temporaryFile, path.join('/user/data/rag', 'index.json'));
	expect(rmSync).toHaveBeenCalledWith(temporaryFile, { force: true });
});

it('reads the RAG manifest from rag/index.json', () => {
	readFileSync.mockReturnValue(JSON.stringify(manifest));

	expect(readRagManifest()).toEqual(manifest);
	expect(readFileSync).toHaveBeenCalledWith(path.join('/user/data/rag', 'index.json'), 'utf8');
});
