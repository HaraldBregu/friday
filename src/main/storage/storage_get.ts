import type { StorageObjectStore } from './remote';

export async function getObject(store: StorageObjectStore, key: string): Promise<Uint8Array> {
	return store.get(key);
}
