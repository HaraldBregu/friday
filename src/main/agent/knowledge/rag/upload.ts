import { ragClient } from './rag_client';
import type { VectorRecord } from './types';

export async function uploadRagMirror(apiKey: string, indexName: string, generation: string, dimensions: number, records: readonly VectorRecord[], signal?: AbortSignal): Promise<void> {
	signal?.throwIfAborted();
	const client = ragClient(signal, apiKey);
	await client.createIndex({ name: indexName, dimension: dimensions, metric: 'cosine', spec: { serverless: { cloud: 'aws', region: 'us-east-1' } }, waitUntilReady: true, suppressConflicts: true });
	const index = client.index(indexName).namespace(generation);
	for (let start = 0; start < records.length; start += 64) {
		signal?.throwIfAborted();
		await index.upsert({ records: records.slice(start, start + 64).map((record) => ({ id: record.id, values: record.vector, metadata: { path: record.path, text: record.text } })) });
	}
	signal?.throwIfAborted();
}
