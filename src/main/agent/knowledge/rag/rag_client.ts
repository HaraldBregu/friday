import { Pinecone } from '@pinecone-database/pinecone';

export function ragClient(): Pinecone {
	const apiKey = process.env.PINECONE_API_KEY?.trim() ?? '';
	if (!apiKey) throw new Error('PINECONE_API_KEY is not configured.');
	return new Pinecone({ apiKey });
}
