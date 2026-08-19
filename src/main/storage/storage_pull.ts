import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StoragePullResult } from '../../shared/storage_types';
import { describeStorageError } from './storage_error';
import { getObject } from './storage_get';
import { listObjects } from './storage_list';
import { storagePrefix } from './storage_prefix';
import { getStorage } from './storage_store';
import { storageTarget } from './storage_target';

// ponytail: full replace mirror — downloads everything, deletes local extras; diff-only if bandwidth matters
export async function pullFiles(id: string): Promise<StoragePullResult> {
	const storage = getStorage(id);
	if (!storage) throw new Error('Storage is not configured.');
	const paths = storage.paths;
	const downloaded: string[] = [];
	const failed: StoragePullResult['failed'] = [];

	for (const entryPath of paths) {
		const prefix = storagePrefix(entryPath);
		try {
			await fs.mkdir(entryPath, { recursive: true });
			if ((await fs.lstat(entryPath)).isSymbolicLink()) {
				throw new Error(`Selected folder is a symbolic link: ${entryPath}`);
			}
			const remote = (await listObjects(id, prefix)).filter((item) => !item.key.endsWith('/'));
			for (const item of remote) {
				try {
					const target = await storageTarget(entryPath, item.key, prefix);
					await fs.mkdir(path.dirname(target), { recursive: true });
					await fs.writeFile(target, await getObject(id, item.key));
					downloaded.push(item.key);
				} catch (error) {
					failed.push({ path: item.key, error: describeStorageError(error) });
				}
			}
		} catch (error) {
			failed.push({ path: entryPath, error: describeStorageError(error) });
		}
	}

	return { downloaded, skipped: [], failed };
}
