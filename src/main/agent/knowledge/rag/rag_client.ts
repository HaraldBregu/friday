import { Pinecone } from '@pinecone-database/pinecone';
import { getProvider } from '../../../settings_store';

export function ragClient(): Pinecone {
	const apiKey = getProvider('pinecone', 'databases')?.apiKey.trim() ?? '';
	if (!apiKey) throw new Error('Pinecone API key not configured.');
	return new Pinecone({ apiKey });
}
