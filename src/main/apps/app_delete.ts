import { rmSync } from 'node:fs';
import path from 'node:path';
import { isExtensionId } from './extension_id';
import { extensionsRoot } from './extension_root';

export function deleteExtension(id: string, appLocation?: string): void {
	const root = path.resolve(extensionsRoot(appLocation));
	const target = path.resolve(root, id);
	if (!isExtensionId(id) || path.dirname(target) !== root) {
		throw new Error('Invalid extension ID.');
	}
	rmSync(target, { recursive: true, force: true });
}
