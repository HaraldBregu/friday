import path from 'node:path';
import { isExtensionId } from './extension_id';
import { extensionsRoot } from './extension_root';

export function extensionManifestPath(id: string, appLocation?: string): string {
	if (!isExtensionId(id)) throw new Error(`Invalid extension id: ${id}`);
	return path.join(extensionsRoot(appLocation), id, 'manifest.json');
}
