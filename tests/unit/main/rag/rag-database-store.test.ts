const getRagConfiguration = jest.fn();
const saveRagConfiguration = jest.fn();

jest.mock('../../../../src/main/agent/knowledge/rag/rag_store', () => ({
	getRagConfiguration,
	ragConfigurationStorePath: '/settings/rag.json',
	saveRagConfiguration,
}));
jest.mock('../../../../src/main/models', () => ({
	loadDatabases: () => [
		{
			id: 'pinecone',
			name: 'Pinecone',
			provider: { id: 'pinecone', name: 'Pinecone' },
		},
	],
}));

import {
	databaseConfigurationStorePath,
	getDatabaseConfiguration,
	saveDatabaseConfiguration,
} from '../../../../src/main/database/database_store';

const ragConfiguration = {
	indexName: 'friday',
	databaseProviderId: 'pinecone',
	databaseId: 'pinecone',
	embeddingProviderId: 'openai',
	embeddingModelId: 'text-embedding-3-small',
	folders: [],
	scheduleEnabled: false,
	cronExpression: '0 3 * * *',
};

beforeEach(() => {
	getRagConfiguration.mockReturnValue(ragConfiguration);
	saveRagConfiguration.mockImplementation((configuration) => configuration);
});

it('reads and writes database selection through the RAG store', () => {
	expect(databaseConfigurationStorePath).toBe('/settings/rag.json');
	expect(getDatabaseConfiguration()).toEqual({
		providerId: 'pinecone',
		databaseId: 'pinecone',
	});

	saveDatabaseConfiguration({
		providerId: 'pinecone',
		databaseId: 'pinecone',
	});

	expect(saveRagConfiguration).toHaveBeenCalledWith({
		...ragConfiguration,
		databaseProviderId: 'pinecone',
		databaseId: 'pinecone',
	});
});
