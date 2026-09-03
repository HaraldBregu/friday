import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StoragePullResult } from '../../shared/storage_types';
import { describeStorageError } from './storage_error';
import { getObject } from './storage_get';
import { listObjects } from './storage_list';
import { normalizeStoragePaths } from './storage_paths';
import { storagePrefix } from './storage_prefix';
import type { StorageObjectStore } from './remote';
import { STORAGE_MAX_OBJECT_BYTES } from './limits';
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
					if (item.size > STORAGE_MAX_OBJECT_BYTES) {
						throw new Error('Cloud restore files must be no larger than 50 MiB.');
					}
					const target = await storageTarget(entryPath, item.key, prefix);
					await fs.mkdir(path.dirname(target), { recursive: true });
					const data = await getObject(store, item.key);
					if (data.byteLength > STORAGE_MAX_OBJECT_BYTES) {
						throw new Error('Cloud restore files must be no larger than 50 MiB.');
					}
					await storageWrite(target, data);
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
