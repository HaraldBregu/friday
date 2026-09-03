import type { CatalogModel } from '@kucedr/sdk';

export function selectGenerationModel(
	catalog: CatalogModel[],
	providerId: string,
	modelId?: string
): CatalogModel | undefined {
	const available = catalog.filter(
		(model) => model.type === 'text-to-image' && model.provider.id === providerId
	);
	return available.find((model) => model.id === modelId) ?? available[0];
}
