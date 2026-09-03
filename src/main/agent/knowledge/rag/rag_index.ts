import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import type { Pinecone } from '@pinecone-database/pinecone';
import { ragClient } from './rag_client';
import { SelectedEmbeddingProvider } from './embedding';
import { normalizeRagIndexName } from './rag_index_name';
import { collectRagSources } from './source';
import { writeRagManifest } from './rag_manifest';
import { getRagConfiguration } from './rag_store';
import { chunkSpans } from './spans';
import { ragVectorStore } from './vector';
import type {
	RagIndexDependencies,
	RagIndexResult,
	VectorRecord,
} from './types';

const BATCH_SIZE = 64;

export async function indexRag(
	folders: readonly string[],
	indexName: string,
	dependencies: RagIndexDependencies = {}
): Promise<RagIndexResult> {
	const selectedIndexName = normalizeRagIndexName(indexName);
	const sources = [...new Set(folders.map((folder) => folder.trim()).filter(Boolean))];
	if (sources.length === 0) throw new Error('Choose at least one source folder before indexing.');

	const configuration = getRagConfiguration();
	const providerId = configuration.embeddingProviderId.trim();
	const modelId = configuration.embeddingModelId.trim();
	if (!providerId || !modelId) {
		throw new Error('Select an embedding provider and model before indexing.');
	}
	if (
		configuration.embeddingConsent?.providerId !== providerId ||
		configuration.embeddingConsent.modelId !== modelId
	) {
		throw new Error(
			'Confirm remote embedding disclosure for the selected provider and model before indexing.'
		);
	}

	const vectorStore = dependencies.vectors ?? ragVectorStore();
	const embeddingProvider = dependencies.embeddings ?? new SelectedEmbeddingProvider();
	const generation = `kucedr-${randomUUID()}`;
	const records: VectorRecord[] = [];
	let dimensions: number | undefined;
	let indexedFiles = 0;

	try {
		for await (const { source, file, content } of collectRagSources(sources)) {
			dependencies.signal?.throwIfAborted();
			const chunks = chunkSpans(content);
			if (chunks.length === 0) continue;
			indexedFiles += 1;
			const sourceId = createHash('sha256')
				.update(path.resolve(source))
				.update('\0')
				.update(file)
				.digest('hex');
			const sourceFingerprint = createHash('sha256').update(content).digest('hex');
			const reused = vectorStore.getReusableSource(
				selectedIndexName,
				sourceId,
				sourceFingerprint,
				providerId,
				modelId
			);
			if (reused) {
				dimensions ??= reused[0].vector.length;
				records.push(...reused);
				continue;
			}

			for (let start = 0; start < chunks.length; start += BATCH_SIZE) {
				dependencies.signal?.throwIfAborted();
				const batch = chunks.slice(start, start + BATCH_SIZE);
				const embedded = await embeddingProvider.embed(
					{
						texts: batch.map((chunk) => chunk.text),
						inputType: 'document',
						providerId,
						modelId,
					},
					dependencies.signal
				);
				dependencies.signal?.throwIfAborted();
				if (embedded.providerId !== providerId || embedded.modelId !== modelId) {
					throw new Error('Embedding provider did not use the selected provider and model.');
				}
				dimensions ??= embedded.dimensions;
				if (embedded.dimensions !== dimensions) {
					throw new Error('Embedding dimensions changed while indexing.');
				}
				for (const [offset, chunk] of batch.entries()) {
					const chunkIndex = start + offset;
					records.push({
						id: `${sourceId}#${chunkIndex}`,
						sourceId,
						sourceFingerprint,
						path: path.join(path.basename(source), file),
						chunkIndex,
						lineStart: chunk.lineStart,
						lineEnd: chunk.lineEnd,
						text: chunk.text,
						checksum: createHash('sha256').update(chunk.text).digest('hex'),
						indexedAt: new Date().toISOString(),
						vector: embedded.embeddings[offset],
					});
				}
			}
		}

		if (!dimensions || records.length === 0) {
			throw new Error('No indexable text content found in the selected source folders.');
		}
		dependencies.signal?.throwIfAborted();

		await mirrorToPinecone(
			selectedIndexName,
			generation,
			dimensions,
			records,
			dependencies.signal
		);
		dependencies.signal?.throwIfAborted();

		const completedAt = new Date().toISOString();
		vectorStore.publish({
			indexName: selectedIndexName,
			generation,
			providerId,
			modelId,
			dimensions,
			completedAt,
			records,
		});
		writeRagManifest({
			indexName: selectedIndexName,
			activeNamespace: generation,
			providerId,
			modelId,
			dimensions,
			completedAt,
		});
		return { files: indexedFiles, vectors: records.length };
	} finally {
		if (!dependencies.vectors) vectorStore.close();
	}
}

async function mirrorToPinecone(
	indexName: string,
	generation: string,
	dimensions: number,
	records: readonly VectorRecord[],
	signal?: AbortSignal
): Promise<void> {
	signal?.throwIfAborted();
	const pinecone = ragClient();
	const index = (await ensureIndex(pinecone, indexName, dimensions)).namespace(generation);
	for (let start = 0; start < records.length; start += BATCH_SIZE) {
		signal?.throwIfAborted();
		await index.upsert({
			records: records.slice(start, start + BATCH_SIZE).map((record) => ({
				id: record.id,
				values: record.vector,
				metadata: { path: record.path, text: record.text },
			})),
		});
		signal?.throwIfAborted();
	}
}

async function ensureIndex(pinecone: Pinecone, indexName: string, dimension: number) {
	if (dimension === 0) throw new Error('Embedding provider returned no dimensions.');
	await pinecone.createIndex({
		name: indexName,
		dimension,
		metric: 'cosine',
		spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
		waitUntilReady: true,
		suppressConflicts: true,
	});
	return pinecone.index(indexName);
}
