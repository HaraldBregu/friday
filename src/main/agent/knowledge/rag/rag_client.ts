import { Pinecone } from '@pinecone-database/pinecone';

export function ragClient(
	signal?: AbortSignal,
	apiKey = process.env.PINECONE_API_KEY?.trim() ?? ''
): Pinecone {
	if (!apiKey) throw new Error('PINECONE_API_KEY is not configured.');
	return new Pinecone({
		apiKey,
		...(signal ? { fetchApi: (input, init) => fetch(input, { ...init, signal }) } : {}),
	});
}
