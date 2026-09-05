const configuration = jest.fn();
const recipient = jest.fn();
jest.mock('../../../../src/main/agent/knowledge/rag/rag_store', () => ({
	getRagConfiguration: configuration,
}));
jest.mock('../../../../src/main/agent/knowledge/rag/recipient', () => ({
	ragRecipient: recipient,
}));
import type {
	EmbeddingProvider,
	VectorStore,
} from '../../../../src/main/agent/knowledge/rag/types';
import { searchRag } from '../../../../src/main/agent/knowledge/rag/rag_search';

const embed = jest.fn();
const embeddings: EmbeddingProvider = { embed };
const getIndex = jest.fn();
const search = jest.fn();
const vectors: VectorStore = {
	getIndex,
	getReusableSource: jest.fn(),
	publish: jest.fn(),
	search,
	exportIndex: jest.fn(),
	purge: jest.fn(),
	close: jest.fn(),
};

beforeEach(() => {
	jest.clearAllMocks();
	recipient.mockReturnValue('approved-recipient');
	configuration.mockReturnValue({
		embeddingConsent: {
			providerId: 'openai',
			modelId: 'text-embedding-3-small',
			version: 1,
			recipient: 'approved-recipient',
		},
	});
	getIndex.mockReturnValue({
		indexName: 'knowledge-base',
		generation: 'kucedr-a1b2c3d4',
		providerId: 'openai',
		modelId: 'text-embedding-3-small',
		dimensions: 2,
		completedAt: '2026-08-08T00:00:00.000Z',
	});
	embed.mockResolvedValue({
		providerId: 'openai',
		modelId: 'text-embedding-3-small',
		dimensions: 2,
		embeddings: [[0.1, 0.2]],
	});
	search.mockReturnValue([
		{
			id: 'record-one',
			sourceId: 'source-one',
			sourceFingerprint: 'fingerprint',
			path: 'documents/guide.md',
			chunkIndex: 0,
			lineStart: 4,
			lineEnd: 6,
			text: 'Local guide text',
			checksum: 'checksum',
			indexedAt: '2026-08-08T00:00:00.000Z',
			vector: [0.1, 0.2],
			score: 0.91,
		},
	]);
});

it('searches SQLite with the exact embedding identity used to build the index', async () => {
	await expect(searchRag('query', 'knowledge-base', 5, { embeddings, vectors })).resolves.toEqual([
		{
			sourceId: 'source-one',
			chunkId: 'record-one',
			path: 'documents/guide.md',
			lineStart: 4,
			lineEnd: 6,
			checksum: 'checksum',
			indexedAt: '2026-08-08T00:00:00.000Z',
			text: 'Local guide text',
			score: 0.91,
		},
	]);
	expect(embed).toHaveBeenCalledWith(
		{
			texts: ['query'],
			inputType: 'query',
			providerId: 'openai',
			modelId: 'text-embedding-3-small',
		},
		undefined
	);
	expect(search).toHaveBeenCalledWith('knowledge-base', [0.1, 0.2], 5);
});

it('passes cancellation to the query embedding provider', async () => {
	const controller = new AbortController();
	const reason = new Error('cancel query');
	embed.mockImplementationOnce(
		(_input, signal: AbortSignal) =>
			new Promise((_resolve, reject) => {
				signal.addEventListener('abort', () => reject(signal.reason), { once: true });
			})
	);
	const result = searchRag('query', 'knowledge-base', 5, {
		embeddings,
		vectors,
		signal: controller.signal,
	});
	controller.abort(reason);

	await expect(result).rejects.toBe(reason);
	expect(embed.mock.calls[0][1]).toBe(controller.signal);
	expect(search).not.toHaveBeenCalled();
});

it('requires the selected local index to exist', async () => {
	getIndex.mockReturnValue(undefined);

	await expect(searchRag('query', 'another-index', 5, { embeddings, vectors })).rejects.toThrow(
		'Index the rag folder before searching.'
	);
	expect(embed).not.toHaveBeenCalled();
});

it('requires query disclosure even when an existing local index can be searched', async () => {
	configuration.mockReturnValue({ embeddingConsent: null });
	await expect(searchRag('query', 'knowledge-base', 5, { embeddings, vectors })).rejects.toThrow(
		'Confirm remote embedding'
	);
	expect(embed).not.toHaveBeenCalled();
});
