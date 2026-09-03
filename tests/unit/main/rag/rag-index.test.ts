import path from 'node:path';
import type {
	EmbeddingProvider,
	VectorStore,
} from '../../../../src/main/agent/knowledge/rag/types';

const lstat = jest.fn();
const readFile = jest.fn();
const readdir = jest.fn();
const stat = jest.fn();
const createIndex = jest.fn();
const upsert = jest.fn();
const namespace = jest.fn(() => ({ upsert }));
const index = jest.fn(() => ({ namespace }));
const ragClient = jest.fn(() => ({ createIndex, index }));
const writeRagManifest = jest.fn();
const getRagConfiguration = jest.fn();

jest.mock('node:fs/promises', () => ({ lstat, readFile, readdir, stat }));
jest.mock('../../../../src/main/agent/knowledge/rag/rag_client', () => ({ ragClient }));
jest.mock('../../../../src/main/agent/knowledge/rag/rag_manifest', () => ({ writeRagManifest }));
jest.mock('../../../../src/main/agent/knowledge/rag/rag_store', () => ({ getRagConfiguration }));

import { indexRag } from '../../../../src/main/agent/knowledge/rag/rag_index';

const embed = jest.fn();
const embeddings: EmbeddingProvider = { embed };
const getReusableSource = jest.fn();
const publish = jest.fn();
const vectors: VectorStore = {
	getIndex: jest.fn(),
	getReusableSource,
	publish,
	search: jest.fn(),
	exportIndex: jest.fn(),
	purge: jest.fn(),
	close: jest.fn(),
};

beforeEach(() => {
	jest.clearAllMocks();
	stat.mockResolvedValue({ isDirectory: () => true });
	lstat.mockResolvedValue({ isFile: () => true });
	readdir.mockResolvedValue(['guide.md']);
	readFile.mockResolvedValue(Buffer.from('# Guide'));
	getRagConfiguration.mockReturnValue({
		embeddingProviderId: 'openai',
		embeddingModelId: 'text-embedding-3-small',
		embeddingConsent: { providerId: 'openai', modelId: 'text-embedding-3-small' },
	});
	embed.mockResolvedValue({
		providerId: 'openai',
		modelId: 'text-embedding-3-small',
		dimensions: 2,
		embeddings: [[0.1, 0.2]],
	});
	getReusableSource.mockReturnValue(undefined);
	createIndex.mockResolvedValue(undefined);
	upsert.mockResolvedValue(undefined);
});

it('publishes SQLite locally and mirrors record fields to Pinecone', async () => {
	const result = await indexRag(['/documents'], 'knowledge-base', { embeddings, vectors });
	const publication = publish.mock.calls[0][0];

	expect(result).toEqual({ files: 1, vectors: 1 });
	expect(publication).toEqual({
		indexName: 'knowledge-base',
		generation: expect.stringMatching(/^kucedr-[a-f0-9-]+$/),
		providerId: 'openai',
		modelId: 'text-embedding-3-small',
		dimensions: 2,
		completedAt: expect.any(String),
		records: [
			expect.objectContaining({
				id: expect.stringMatching(/^[a-f0-9]{64}#0$/),
				path: path.join('documents', 'guide.md'),
				text: '# Guide',
				vector: [0.1, 0.2],
			}),
		],
	});
	expect(writeRagManifest).toHaveBeenCalledWith({
		indexName: 'knowledge-base',
		activeNamespace: publication.generation,
		providerId: 'openai',
		modelId: 'text-embedding-3-small',
		dimensions: 2,
		completedAt: publication.completedAt,
	});
	expect(upsert).toHaveBeenCalledWith({
		records: [
			{
				id: publication.records[0].id,
				values: [0.1, 0.2],
				metadata: { path: path.join('documents', 'guide.md'), text: '# Guide' },
			},
		],
	});
});

it('reuses unchanged source vectors by fingerprint without another embedding call', async () => {
	getRagConfiguration.mockReturnValue({
		embeddingProviderId: 'openai',
		embeddingModelId: 'text-embedding-3-small',
		embeddingConsent: { providerId: 'openai', modelId: 'text-embedding-3-small' },
		databaseProviderId: '',
	});
	getReusableSource.mockReturnValue([
		{
			id: 'source#0',
			sourceId: 'source',
			sourceFingerprint: 'fingerprint',
			path: 'documents/guide.md',
			chunkIndex: 0,
			lineStart: 1,
			lineEnd: 1,
			text: '# Guide',
			checksum: 'checksum',
			indexedAt: '2026-08-08T00:00:00.000Z',
			vector: [0.1, 0.2],
		},
	]);

	await indexRag(['/documents'], 'knowledge-base', { embeddings, vectors });

	expect(embed).not.toHaveBeenCalled();
	expect(publish.mock.calls[0][0].records).toHaveLength(1);
});

it('indexes nested and extensionless text files while skipping binary files', async () => {
	getRagConfiguration.mockReturnValue({
		embeddingProviderId: 'openai',
		embeddingModelId: 'text-embedding-3-small',
		embeddingConsent: { providerId: 'openai', modelId: 'text-embedding-3-small' },
		databaseProviderId: '',
	});
	readdir.mockResolvedValue(['nested', 'nested/guide.txt', 'README', 'nested/image.png']);
	lstat.mockImplementation(async (filePath: string) => ({
		isFile: () => filePath !== path.join('/documents', 'nested'),
	}));
	readFile.mockImplementation(async (filePath: string) => {
		if (filePath.endsWith('image.png')) return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]);
		if (filePath.endsWith('README')) return Buffer.from('Extensionless notes');
		return Buffer.from('Nested guide');
	});
	embed
		.mockResolvedValueOnce({
			providerId: 'openai',
			modelId: 'text-embedding-3-small',
			dimensions: 2,
			embeddings: [[1, 0]],
		})
		.mockResolvedValueOnce({
			providerId: 'openai',
			modelId: 'text-embedding-3-small',
			dimensions: 2,
			embeddings: [[0, 1]],
		});

	const result = await indexRag(['/documents'], 'knowledge-base', { embeddings, vectors });

	expect(result).toEqual({ files: 2, vectors: 2 });
	expect(embed.mock.calls.map(([request]) => request.texts[0])).toEqual([
		'Extensionless notes',
		'Nested guide',
	]);
});

it('does not publish locally when the Pinecone mirror fails', async () => {
	upsert.mockRejectedValueOnce(new Error('remote failure'));

	await expect(
		indexRag(['/documents'], 'knowledge-base', { embeddings, vectors })
	).rejects.toThrow('remote failure');
	expect(publish).not.toHaveBeenCalled();
	expect(writeRagManifest).not.toHaveBeenCalled();
});

it('does not publish an index when its embedding run is cancelled', async () => {
	getRagConfiguration.mockReturnValue({
		embeddingProviderId: 'openai',
		embeddingModelId: 'text-embedding-3-small',
		embeddingConsent: { providerId: 'openai', modelId: 'text-embedding-3-small' },
		databaseProviderId: '',
	});
	const controller = new AbortController();
	const reason = new Error('cancel indexing');
	let embeddingStarted: (() => void) | undefined;
	const started = new Promise<void>((resolve) => {
		embeddingStarted = resolve;
	});
	embed.mockImplementationOnce(
		(_input, signal: AbortSignal) =>
			new Promise((_resolve, reject) => {
				embeddingStarted?.();
				signal.addEventListener('abort', () => reject(signal.reason), { once: true });
			})
	);
	const result = indexRag(['/documents'], 'knowledge-base', {
		embeddings,
		vectors,
		signal: controller.signal,
	});
	await started;
	controller.abort(reason);

	await expect(result).rejects.toBe(reason);
	expect(embed.mock.calls[0][1]).toBe(controller.signal);
	expect(publish).not.toHaveBeenCalled();
	expect(writeRagManifest).not.toHaveBeenCalled();
});

it('requires an explicit embedding provider and model', async () => {
	getRagConfiguration.mockReturnValue({
		embeddingProviderId: '',
		embeddingModelId: '',
		embeddingConsent: null,
		databaseProviderId: '',
	});

	await expect(
		indexRag(['/documents'], 'knowledge-base', { embeddings, vectors })
	).rejects.toThrow('Select an embedding provider and model before indexing.');
	expect(embed).not.toHaveBeenCalled();
});

it('requires disclosure consent bound to the selected provider and model', async () => {
	getRagConfiguration.mockReturnValue({
		embeddingProviderId: 'openai',
		embeddingModelId: 'text-embedding-3-small',
		embeddingConsent: { providerId: 'voyage', modelId: 'voyage-3' },
		databaseProviderId: '',
	});

	await expect(
		indexRag(['/documents'], 'knowledge-base', { embeddings, vectors })
	).rejects.toThrow('Confirm remote embedding disclosure');
	expect(embed).not.toHaveBeenCalled();
});

it('refuses to upload credential-like text files', async () => {
	readdir.mockResolvedValue(['.env']);
	readFile.mockResolvedValue(Buffer.from('API_KEY=abcdefghijklmnopqrstuvwxyz123456'));

	await expect(
		indexRag(['/documents'], 'knowledge-base', { embeddings, vectors })
	).rejects.toThrow('Refusing to ingest credential-like file: .env');
	expect(embed).not.toHaveBeenCalled();
});
