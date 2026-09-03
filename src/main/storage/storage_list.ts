import type { StorageObjectInfo } from '../../shared/storage_types';
import type { StorageObjectStore } from './remote';

export async function listObjects(
	store: StorageObjectStore,
	prefix = ''
): Promise<StorageObjectInfo[]> {
	return store.list(prefix);
}
