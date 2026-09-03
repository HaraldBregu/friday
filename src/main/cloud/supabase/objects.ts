import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorageObjectInfo } from '../../../shared/storage_types';
import type { StorageObjectStore } from '../../storage/remote';
import { publicCloudError } from '../cloud_error';

export class SupabaseObjectStore implements StorageObjectStore {
	constructor(
		private readonly client: SupabaseClient,
		private readonly ownerId: () => string | undefined
	) {}

	async get(key: string): Promise<Uint8Array> {
		const { data, error } = await this.bucket().download(this.objectPath(key));
		if (error) throw publicCloudError(error);
		return new Uint8Array(await data.arrayBuffer());
	}

	async list(prefix = ''): Promise<StorageObjectInfo[]> {
		const ownerId = this.requireOwnerId();
		const normalizedPrefix = this.normalizePrefix(prefix);
		const base = `${ownerId}/backups/`;
		const pending = [`${base}${normalizedPrefix}`.replace(/\/+$/, '')];
		const objects: StorageObjectInfo[] = [];
		while (pending.length > 0) {
			const folder = pending.shift();
			if (!folder) continue;
			let offset = 0;
			for (;;) {
				const { data, error } = await this.bucket().list(folder, {
					limit: 100,
					offset,
					sortBy: { column: 'name', order: 'asc' },
				});
				if (error) throw publicCloudError(error);
				for (const entry of data) {
					const remotePath = `${folder}/${entry.name}`;
					if (entry.id === null) {
						pending.push(remotePath);
						continue;
					}
					objects.push({
						key: remotePath.slice(base.length),
						size: Number(entry.metadata?.size ?? 0),
						lastModified: entry.updated_at ?? undefined,
					});
				}
				if (data.length < 100) break;
				offset += data.length;
			}
		}
		return objects;
	}

	async put(key: string, data: Uint8Array, contentType?: string): Promise<void> {
		const { error } = await this.bucket().upload(this.objectPath(key), data, {
			upsert: true,
			...(contentType ? { contentType } : {}),
		});
		if (error) throw publicCloudError(error);
	}

	private bucket(): ReturnType<SupabaseClient['storage']['from']> {
		return this.client.storage.from('user-files');
	}

	private objectPath(key: string): string {
		const normalized = this.normalizeKey(key);
		return `${this.requireOwnerId()}/backups/${normalized}`;
	}

	private normalizeKey(key: string): string {
		if (
			!key ||
			key.startsWith('/') ||
			key.includes('\\') ||
			key.split('/').some((segment) => !segment || segment === '.' || segment === '..')
		) {
			throw new Error('Cloud backup object key is invalid.');
		}
		return key;
	}

	private normalizePrefix(prefix: string): string {
		if (!prefix) return '';
		const normalized = prefix.replace(/\/+$/, '');
		return this.normalizeKey(normalized);
	}

	private requireOwnerId(): string {
		const ownerId = this.ownerId();
		if (!ownerId) throw new Error('Sign in to use cloud backup.');
		return ownerId;
	}
}
