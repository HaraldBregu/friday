import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StoragePushResult } from '../../shared/storage_types';
import type { AuthService } from '../cloud/auth';
import { describeStorageError } from './storage_error';
import { putObject } from './storage_put';
import { normalizeStoragePaths } from './storage_paths';
import { storagePrefix } from './storage_prefix';
import { getStorageSettings } from './storage_store';
import { walkFiles } from './storage_walk';

export async function pushFiles(auth: AuthService): Promise<StoragePushResult> {
	const storage = getStorageSettings();
	const paths = normalizeStoragePaths(storage.paths);
	const uploaded: string[] = [];
	const failed: StoragePushResult['failed'] = [];

	const uploadFile = async (filePath: string, key: string): Promise<void> => {
		try {
			const data = await fs.readFile(filePath);
			await putObject(auth, key, data);
			uploaded.push(filePath);
		} catch (error) {
			failed.push({ path: filePath, error: describeStorageError(error) });
		}
	};

	for (const entryPath of paths) {
		try {
			const stat = await fs.lstat(entryPath);
			if (stat.isSymbolicLink()) {
				throw new Error(`Selected path is a symbolic link: ${entryPath}`);
			}
			const prefix = storagePrefix(entryPath);
			if (stat.isDirectory()) {
				for (const file of await walkFiles(entryPath)) {
					const relative = path.relative(entryPath, file).split(path.sep).join('/');
					await uploadFile(file, `${prefix}${relative}`);
				}
			} else {
				await uploadFile(entryPath, `${prefix}${path.basename(entryPath)}`);
			}
		} catch (error) {
			failed.push({ path: entryPath, error: describeStorageError(error) });
		}
	}

	return { uploaded, failed };
}
