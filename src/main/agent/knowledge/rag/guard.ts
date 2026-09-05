import { getRagConfiguration } from './rag_store';
import { assertRagConsent } from './consent';

export function assertMirrorCurrent(apiKey: string, indexName: string): void {
	if (process.env.PINECONE_API_KEY?.trim() !== apiKey)
		throw new Error('Pinecone account changed during indexing.');
	const configuration = getRagConfiguration();
	assertRagConsent(
		configuration,
		configuration.embeddingProviderId,
		configuration.embeddingModelId,
		indexName,
		true
	);
}
