export const DEFAULT_RAG_INDEX_NAME = 'kucedr';

export interface RagConfiguration {
	enabled: boolean;
	indexName: string;
	databaseProviderId: string;
	databaseId: string;
	embeddingProviderId: string;
	embeddingModelId: string;
	embeddingConsent: { providerId: string; modelId: string; version?: 1; recipient?: string } | null;
	mirrorConsent?: { version: 1; indexName: string; recipient?: string } | null;
	folders: string[];
	scheduleEnabled: boolean;
	cronExpression: string;
}
