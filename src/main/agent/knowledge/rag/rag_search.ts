import { assertRagConsent } from './consent';
import { getRagConfiguration } from './rag_store';
import { containsSecret } from '../secrets';
import { DEFAULT_RAG_INDEX_NAME } from '../../../../shared/rag_types';
import { SelectedEmbeddingProvider } from './embedding';
import { normalizeRagIndexName } from './rag_index_name';
import { ragVectorStore } from './vector';
import type { RagMatch, RagSearchDependencies } from './types';

export async function searchRag(
	query: string,
	indexName: string,
	topK = 5,
	dependencies: RagSearchDependencies = {}
): Promise<RagMatch[]> {
	const selectedIndexName = normalizeRagIndexName(indexName);
	const vectorStore = dependencies.vectors ?? ragVectorStore();
	const embeddingProvider = dependencies.embeddings ?? new SelectedEmbeddingProvider();

	try {
		dependencies.signal?.throwIfAborted();
		const index = vectorStore.getIndex(selectedIndexName);
		if (!index) throw new Error('Index the rag folder before searching.');
		if ((index.indexName ?? DEFAULT_RAG_INDEX_NAME) !== selectedIndexName) {
			throw new Error('Generate the selected RAG index before searching.');
		}

		assertRagConsent(getRagConfiguration(), index.providerId, index.modelId, selectedIndexName);
		if (query.length > 16_000 || containsSecret(query))
			throw new Error('Query is oversized or contains credential-like content.');
		const embedded = await embeddingProvider.embed(
			{
				texts: [query],
				inputType: 'query',
				providerId: index.providerId,
				modelId: index.modelId,
			},
			dependencies.signal
		);
		dependencies.signal?.throwIfAborted();
		if (embedded.providerId !== index.providerId || embedded.modelId !== index.modelId) {
			throw new Error('Embedding provider did not use the indexed provider and model.');
		}

		return vectorStore.search(selectedIndexName, embedded.embeddings[0], topK).map((match) => ({
			sourceId: match.sourceId,
			chunkId: match.id,
			path: match.path,
			lineStart: match.lineStart,
			lineEnd: match.lineEnd,
			checksum: match.checksum,
			indexedAt: match.indexedAt,
			text: match.text,
			score: match.score,
		}));
	} finally {
		if (!dependencies.vectors) vectorStore.close();
	}
}
