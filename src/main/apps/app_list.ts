import { existsSync, readdirSync, statSync } from 'node:fs';
import { extensionEntryPath } from './extension_entry';
import { isExtensionId } from './extension_id';
import { readExtensionManifest } from './extension_read';
import { extensionsRoot } from './extension_root';
import type { Extension } from './extension_types';

export function listExtensions(appLocation?: string): Extension[] {
	const root = extensionsRoot(appLocation);
	const extensions: Extension[] = [];
	const directories = existsSync(root)
		? readdirSync(root, { withFileTypes: true })
				.filter((entry) => entry.isDirectory() && isExtensionId(entry.name))
				.sort((left, right) => left.name.localeCompare(right.name))
		: [];
	for (const directory of directories) {
		const manifest = readExtensionManifest(directory.name, appLocation);
		if (!manifest) continue;
		const entry = extensionEntryPath(directory.name, manifest.metadata.entry, appLocation);
		try {
			if (!statSync(entry).isFile()) continue;
		} catch {
			continue;
		}
		extensions.push({ id: directory.name, ...manifest });
	}
	return extensions.sort((left, right) => left.id.localeCompare(right.id));
}
