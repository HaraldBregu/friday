import path from 'node:path';
import { isExtensionEntry } from './extension_entry_validate';
import { isExtensionId } from './extension_id';
import { extensionsRoot } from './extension_root';

export function extensionEntryPath(id: string, entry: string, appLocation?: string): string {
	if (!isExtensionId(id)) throw new Error(`Invalid extension id: ${id}`);
	if (!isExtensionEntry(entry)) throw new Error(`Invalid extension entry: ${entry}`);
	return path.join(extensionsRoot(appLocation), id, ...entry.split('/'));
}
