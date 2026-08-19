import { createHash } from 'node:crypto';
import path from 'node:path';
import { syncFolders } from './storage_sync_folders';

export function storagePrefix(localPath: string): string {
	const resolved = path.resolve(localPath);
	const builtIn = syncFolders().find((folder) => path.resolve(folder.path) === resolved);
	if (builtIn) return `friday/v1/${builtIn.key}/`;
	const digest = createHash('sha256').update(resolved).digest('hex').slice(0, 12);
	return `friday/v1/custom/${digest}-${path.basename(resolved)}/`;
}
