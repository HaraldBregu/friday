import { isExtensionEntry } from './extension_entry_validate';
import type { ExtensionManifest } from './extension_types';

export function isExtensionManifest(value: unknown): value is ExtensionManifest {
	if (!value || typeof value !== 'object') return false;
	const manifest = value as Record<string, unknown>;
	const metadata = manifest.metadata as Record<string, unknown> | undefined;
	return (
		typeof manifest.title === 'string' &&
		manifest.title.trim().length > 0 &&
		typeof manifest.description === 'string' &&
		manifest.description.trim().length > 0 &&
		Boolean(metadata) &&
		typeof metadata === 'object' &&
		!Array.isArray(metadata) &&
		typeof metadata.version === 'string' &&
		metadata.version.trim().length > 0 &&
		typeof metadata.category === 'string' &&
		metadata.category.trim().length > 0 &&
		isExtensionEntry(metadata.entry)
	);
}
