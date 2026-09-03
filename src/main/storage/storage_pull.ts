import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StoragePullResult } from '../../shared/storage_types';
import { describeStorageError } from './storage_error';
import { getObject } from './storage_get';
import { listObjects } from './storage_list';
import { normalizeStoragePaths } from './storage_paths';
import { storagePrefix } from './storage_prefix';
import type { StorageObjectStore } from './remote';
import { getStorageSettings } from './storage_store';
import { storageTarget } from './storage_target';
import { storageWrite } from './storage_write';

export async function pullFiles(store: StorageObjectStore): Promise<StoragePullResult> {
	const storage = getStorageSettings();
	const paths = normalizeStoragePaths(storage.paths);
	const downloaded: string[] = [];
	const failed: StoragePullResult['failed'] = [];

	for (const entryPath of paths) {
		const prefix = storagePrefix(entryPath);
		try {
			await fs.mkdir(entryPath, { recursive: true });
			if ((await fs.lstat(entryPath)).isSymbolicLink()) {
				throw new Error(`Selected folder is a symbolic link: ${entryPath}`);
			}
			const remote = (await listObjects(store, prefix)).filter((item) => !item.key.endsWith('/'));
			for (const item of remote) {
				try {
					const target = await storageTarget(entryPath, item.key, prefix);
					await fs.mkdir(path.dirname(target), { recursive: true });
					await storageWrite(target, await getObject(store, item.key));
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
