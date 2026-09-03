import type { StorageObjectInfo } from '../../shared/storage_types';
import type { StorageObjectStore } from './remote';

export class UnavailableObjectStore implements StorageObjectStore {
	get(_key: string): Promise<Uint8Array> {
		return Promise.reject(this.error());
	}

	list(_prefix?: string): Promise<StorageObjectInfo[]> {
		return Promise.reject(this.error());
	}

	put(_key: string, _data: Uint8Array, _contentType?: string): Promise<void> {
		return Promise.reject(this.error());
	}

	private error(): Error {
		return new Error('Cloud backup is unavailable in this build.');
	}
}
