import type { StorageObjectStore } from './remote';

export async function putObject(
	store: StorageObjectStore,
	key: string,
	data: Uint8Array,
	contentType?: string
): Promise<void> {
	await store.put(key, data, contentType);
}
