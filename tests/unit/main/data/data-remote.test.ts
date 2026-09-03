const deleteNamespace = jest.fn();
const listNamespaces = jest.fn();
const index = jest.fn(() => ({ deleteNamespace, listNamespaces }));
const ragClient = jest.fn(() => ({ index }));

jest.mock('../../../../src/main/agent/knowledge/rag/rag_client', () => ({ ragClient }));

import { DataController } from '../../../../src/main/data/data_controller';

beforeEach(() => jest.clearAllMocks());

it('purges only an explicitly scoped remote namespace and never the Pinecone index', async () => {
	const controller = new DataController({
		config: { location: '/workspace' },
		listSessions: () => [],
		deleteSession: jest.fn(),
	});
	const scope = {
		kind: 'rag' as const,
		mode: 'remote_namespace' as const,
		indexName: 'knowledge-base',
		generation: 'kucedr-11111111-1111-4111-8111-111111111111',
	};
	const preview = await controller.previewPurge(scope);

	expect(preview.remoteDataIncluded).toBe(true);
	await expect(controller.export(scope, '/tmp/export.json')).rejects.toThrow(
		'Remote namespaces cannot be exported'
	);
	await expect(controller.purge(scope, preview.confirmationId)).resolves.toEqual(
		expect.objectContaining({ remoteDataDeleted: true })
	);
	expect(index).toHaveBeenCalledWith('knowledge-base');
	expect(deleteNamespace).toHaveBeenCalledWith(scope.generation);
	expect(index.mock.results[0].value).not.toHaveProperty('deleteIndex');
});

it('purges all Kucedr namespaces without deleting unrelated namespaces or the index', async () => {
	listNamespaces
		.mockResolvedValueOnce({
			namespaces: [
				{ name: 'kucedr-11111111-1111-4111-8111-111111111111' },
				{ name: 'another-application' },
			],
			pagination: { next: 'page-2' },
		})
		.mockResolvedValueOnce({
			namespaces: [{ name: 'kucedr-22222222-2222-4222-8222-222222222222' }],
		});
	const controller = new DataController({
		config: { location: '/workspace' },
		listSessions: () => [],
		deleteSession: jest.fn(),
	});
	const scope = {
		kind: 'rag' as const,
		mode: 'remote_all_namespaces' as const,
		indexName: 'knowledge-base',
	};
	const preview = await controller.previewPurge(scope);
	const result = await controller.purge(scope, preview.confirmationId);

	expect(result).toMatchObject({ remoteDataDeleted: true, remoteNamespacesDeleted: 2 });
	expect(listNamespaces).toHaveBeenNthCalledWith(1, { prefix: 'kucedr-', limit: 100 });
	expect(listNamespaces).toHaveBeenNthCalledWith(2, {
		prefix: 'kucedr-',
		limit: 100,
		paginationToken: 'page-2',
	});
	expect(deleteNamespace.mock.calls.map(([namespace]) => namespace)).toEqual([
		'kucedr-11111111-1111-4111-8111-111111111111',
		'kucedr-22222222-2222-4222-8222-222222222222',
	]);
	expect(index.mock.results.at(-1)?.value).not.toHaveProperty('deleteIndex');
});
