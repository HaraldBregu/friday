import { ragClient } from './rag_client';

export async function discardRagMirror(apiKey: string, indexName: string, generation: string, signal?: AbortSignal): Promise<void> {
	if (!/^kucedr-[0-9a-f-]{36}$/.test(generation)) throw new Error('Invalid staging namespace.');
	signal?.throwIfAborted();
	try { await ragClient(signal, apiKey).index(indexName).deleteNamespace(generation); }
	catch (error) {
		if ((error as { status?: number; name?: string }).status !== 404 && (error as { name?: string }).name !== 'PineconeNotFoundError') throw error;
	}
}
