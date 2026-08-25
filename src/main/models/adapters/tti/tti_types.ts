import type { ImageSource } from '../../../../shared/image_types';

export interface ImageProviderSpec {
	id: string;
	name: string;
	apiKey: string;
	baseURL?: string;
}

export interface ImageAdapterGenerationRequest {
	modelId: string;
	prompt: string;
	source?: ImageSource;
	options?: Record<string, unknown>;
	signal?: AbortSignal;
}

export interface ImageGenerationResult {
	base64: string;
	mimeType: string;
}

export interface ImageAdapter {
	readonly supportsSource?: boolean;
	generate(request: ImageAdapterGenerationRequest): Promise<ImageGenerationResult>;
}
