import cron from 'node-cron';
import type { StorageConfig } from '../../shared/storage_types';
import { normalizeStoragePaths } from './storage_paths';

export function normalizeStorageConfig(value: unknown): StorageConfig {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('Invalid storage configuration.');
	}
	const input = value as Partial<StorageConfig>;
	const id = typeof input.id === 'string' ? input.id.trim() : '';
	const name = typeof input.name === 'string' ? input.name.trim() : '';
	const endpoint = typeof input.endpoint === 'string' ? input.endpoint.trim() : '';
	const region = typeof input.region === 'string' ? input.region.trim() : '';
	const accessKeyId = typeof input.accessKeyId === 'string' ? input.accessKeyId.trim() : '';
	const secretAccessKey =
		typeof input.secretAccessKey === 'string' ? input.secretAccessKey.trim() : '';
	const bucket = typeof input.bucket === 'string' ? input.bucket.trim() : '';
	const syncCronExpression =
		typeof input.syncCronExpression === 'string'
			? input.syncCronExpression.trim().replace(/\s+/g, ' ')
			: '';
	if (id && !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(id)) {
		throw new Error('Storage profile ID is invalid.');
	}
	if (!name || name.length > 100) throw new Error('Storage name is required.');
	if (!bucket || bucket.length > 255) throw new Error('Bucket name is required.');
	if (!accessKeyId || accessKeyId.length > 1024) throw new Error('Access key ID is required.');
	if (!secretAccessKey || secretAccessKey.length > 4096) {
		throw new Error('Secret access key is required.');
	}
	if (!region || region.length > 100) throw new Error('Storage region is required.');
	if (endpoint) {
		let url: URL;
		try {
			url = new URL(endpoint);
		} catch {
			throw new Error('Storage endpoint must be a valid URL.');
		}
		if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
			throw new Error('Storage endpoint must use HTTP or HTTPS without embedded credentials.');
		}
	}
	if (typeof input.forcePathStyle !== 'boolean') {
		throw new Error('Invalid path-style option.');
	}
	if (typeof input.syncEnabled !== 'boolean') throw new Error('Invalid sync setting.');
	if (!cron.validate(syncCronExpression)) {
		throw new Error('Storage sync schedule must be a valid cron expression.');
	}
	return {
		id,
		name,
		endpoint,
		region,
		accessKeyId,
		secretAccessKey,
		bucket,
		forcePathStyle: input.forcePathStyle,
		paths: normalizeStoragePaths(input.paths),
		syncEnabled: input.syncEnabled,
		syncCronExpression,
	};
}
