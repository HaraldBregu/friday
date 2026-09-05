import { createHash } from 'node:crypto';
import { getProvider } from '../../../settings_store';
import { EMBEDDING_PROVIDERS } from '../../../models/embedding/embedding_providers';

export function ragRecipient(
	kind: 'embedding' | 'mirror',
	providerId: string,
	modelId: string,
	indexName: string
): string {
	if (kind === 'mirror') {
		const key = process.env.PINECONE_API_KEY?.trim();
		if (!key) throw new Error('PINECONE_API_KEY is not configured.');
		return createHash('sha256')
			.update(
				JSON.stringify(['pinecone', 'https://api.pinecone.io', 'aws', 'us-east-1', indexName, key])
			)
			.digest('hex');
	}
	const provider = EMBEDDING_PROVIDERS[providerId];
	const key = getProvider(providerId)?.apiKey.trim();
	if (!provider || provider.local || !key)
		throw new Error('A configured remote embedding provider is required.');
	return createHash('sha256')
		.update(JSON.stringify([providerId, modelId, provider.url, key]))
		.digest('hex');
}
