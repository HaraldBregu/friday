import type { CatalogModel } from '@kucedr/sdk';

export function selectEditModel(
	catalog: CatalogModel[],
	providerId: string,
	modelId?: string
): CatalogModel | undefined {
	const available = catalog.filter(
		(model) => model.type === 'text-to-image' && model.provider.id === providerId
	);
	const current = available.find((model) => model.id === modelId);
	if (providerId === 'google') return current ?? available[0];
	const acceptsSource = (model: CatalogModel): boolean => {
		const inputs = model.metadata?.inputs ?? {};
		return 'input_image' in inputs || 'image' in inputs;
	};
	return (current && acceptsSource(current) ? current : undefined) ?? available.find(acceptsSource);
}
