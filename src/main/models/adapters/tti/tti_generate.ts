import { buildImageAdapter } from './tti_factory';
import { ImageProviderUnsupportedError } from './tti_errors';
import type { ImageSource } from '../../../../shared/image_types';
import type { ImageGenerationResult } from './tti_types';

export interface GenerateImageOptions {
	providerId: string;
	apiKey: string;
	modelId: string;
	prompt: string;
	source?: ImageSource;
	options?: Record<string, unknown>;
	baseURL?: string;
	signal?: AbortSignal;
}

export async function generateImage(options: GenerateImageOptions): Promise<ImageGenerationResult> {
	const adapter = buildImageAdapter({
		id: options.providerId,
		name: options.providerId,
		apiKey: options.apiKey,
		baseURL: options.baseURL,
	});
	if (options.source && !adapter.supportsSource) {
		throw new ImageProviderUnsupportedError(
			`${options.providerId} does not support source-image editing.`
		);
	}
	return adapter.generate({
		modelId: options.modelId,
		prompt: options.prompt,
		source: options.source,
		options: options.options,
		signal: options.signal,
	});
}
