import path from 'node:path';

const readFileBoundedSync = jest.fn();
jest.mock('../../../../src/main/agent/files/read_sync', () => ({ readFileBoundedSync }));
jest.mock('../../../../src/main/agent/knowledge/root', () => ({ knowledgeRoot: (root: string) => root }));

jest.mock('../../../../src/main/agent/knowledge/rag/rag_location', () => ({
	ragLocation: () => '/user/data/rag',
}));

import { readRagArtifact } from '../../../../src/main/agent/knowledge/rag/rag_artifact';

beforeEach(() => {
	readFileBoundedSync.mockReset();
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
	readFileBoundedSync.mockReturnValue({ content: Buffer.from(JSON.stringify(artifact)) });

	expect(readRagArtifact('embeddings-kucedr-a1b2c3d4.json')).toEqual(artifact);
	expect(readFileBoundedSync).toHaveBeenCalledWith(
		path.join('/user/data/rag', 'embeddings-kucedr-a1b2c3d4.json'),
		100 * 1024 * 1024
	);
});

it('rejects artifact paths outside the local RAG directory', () => {
	expect(readRagArtifact('../embeddings-kucedr-a1b2c3d4.json')).toBeUndefined();
	expect(readFileBoundedSync).not.toHaveBeenCalled();
});
