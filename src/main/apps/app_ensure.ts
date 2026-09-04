import { mkdirSync } from 'node:fs';
import { listExtensions } from './extension_list';
import { extensionsRoot } from './extension_root';
import type { Extension } from './extension_types';

export function ensureExtensions(appLocation?: string): Extension[] {
	mkdirSync(extensionsRoot(appLocation), { recursive: true });
	return listExtensions(appLocation);
}
