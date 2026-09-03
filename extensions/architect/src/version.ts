import type { ImageResult } from '@kucedr/sdk';
import type { ArchitectVersion } from './types';

export function createVersion(
	result: ImageResult,
	label: string,
	prompt: string
): ArchitectVersion {
	const createdAt = Date.now();
	return {
		id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
		base64: result.base64,
		mimeType: result.mimeType as ArchitectVersion['mimeType'],
		label,
		prompt,
		createdAt,
		url: `data:${result.mimeType};base64,${result.base64}`,
	};
}
