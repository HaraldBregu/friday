import path from 'node:path';

const readFileSync = jest.fn();

jest.mock('node:fs', () => ({ readFileSync }));
jest.mock('../../../../src/main/agent/knowledge/rag/rag_location', () => ({
	ragLocation: () => '/user/data/rag',
}));

import { readRagArtifact } from '../../../../src/main/agent/knowledge/rag/rag_artifact';

beforeEach(() => {
	readFileSync.mockReset();
});

it('reads a Kucedr-owned versioned artifact from the local RAG directory', () => {
	const artifact = {
		indexName: 'knowledge-base',
		activeNamespace: 'kucedr-a1b2c3d4',
		providerId: 'openai',
		modelId: 'text-embedding-3-small',
		dimensions: 2,
		records: [],
	};
	readFileSync.mockReturnValue(JSON.stringify(artifact));

	expect(readRagArtifact('embeddings-kucedr-a1b2c3d4.json')).toEqual(artifact);
	expect(readFileSync).toHaveBeenCalledWith(
		path.join('/user/data/rag', 'embeddings-kucedr-a1b2c3d4.json'),
		'utf8'
	);
});

it('rejects artifact paths outside the local RAG directory', () => {
	expect(readRagArtifact('../embeddings-kucedr-a1b2c3d4.json')).toBeUndefined();
	expect(readFileSync).not.toHaveBeenCalled();
});
