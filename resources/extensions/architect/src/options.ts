import type { CatalogModel } from '@kucedr/sdk';
import type { GenerationBrief } from './types';

export function createGenerationOptions(
	model: CatalogModel | undefined,
	brief: GenerationBrief
): Record<string, unknown> | undefined {
	const inputs = model?.metadata?.inputs ?? {};
	const options: Record<string, unknown> = {};
	if ('aspectRatio' in inputs) options.aspectRatio = brief.ratio;
	if ('aspect_ratio' in inputs) options.aspect_ratio = brief.ratio;
	if ('imageSize' in inputs) options.imageSize = '2K';
	if ('size' in inputs) {
		options.size =
			({ '1:1': '1024*1024', '4:3': '1280*960', '3:2': '1152*768', '16:9': '1280*720' } as const)[
				brief.ratio
			];
	}
	return Object.keys(options).length > 0 ? options : undefined;
}
