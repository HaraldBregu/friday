import type { StorageObjectInfo } from '../../shared/storage_types';

export interface StorageObjectStore {
	get(key: string): Promise<Uint8Array>;
	list(prefix?: string): Promise<StorageObjectInfo[]>;
	put(key: string, data: Uint8Array, contentType?: string): Promise<void>;
}
