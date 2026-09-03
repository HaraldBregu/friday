import { ragClient } from '../agent/knowledge/rag/rag_client';

export async function purgeRemoteRagNamespaces(
	indexName: string,
	generation?: string
): Promise<number> {
	const index = ragClient().index(indexName);
	if (generation) {
		await index.deleteNamespace(generation);
		return 1;
	}

	let deleted = 0;
	let paginationToken: string | undefined;
	const seenTokens = new Set<string>();
	do {
		const page = await index.listNamespaces({
			prefix: 'kucedr-',
			limit: 100,
			...(paginationToken ? { paginationToken } : {}),
		});
		for (const namespace of page.namespaces ?? []) {
			const name = namespace.name ?? '';
			if (
				!/^kucedr-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
					name
				)
			) {
				continue;
			}
			await index.deleteNamespace(name);
			deleted += 1;
		}
		const next = page.pagination?.next;
		if (!next || seenTokens.has(next)) break;
		seenTokens.add(next);
		paginationToken = next;
	} while (paginationToken);
	return deleted;
}
