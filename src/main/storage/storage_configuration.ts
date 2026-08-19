import cron from 'node-cron';
import type { StorageConfiguration } from '../../shared/storage_types';
import { normalizeStoragePaths } from './storage_paths';

export function normalizeStorageConfiguration(value: unknown): StorageConfiguration {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('Invalid storage sync configuration.');
	}
	const input = value as Partial<StorageConfiguration>;
	const providerId = typeof input.providerId === 'string' ? input.providerId.trim() : undefined;
	const syncCronExpression =
		typeof input.syncCronExpression === 'string'
			? input.syncCronExpression.trim().replace(/\s+/g, ' ')
			: '';
	if (input.providerId !== undefined && !providerId) {
		throw new Error('Storage profile ID is invalid.');
	}
	if (providerId && !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(providerId)) {
		throw new Error('Storage profile ID is invalid.');
	}
	if (typeof input.syncEnabled !== 'boolean') throw new Error('Invalid sync setting.');
	if (!cron.validate(syncCronExpression)) {
		throw new Error('Storage sync schedule must be a valid cron expression.');
	}
	return {
		providerId,
		storageId: undefined,
		paths: normalizeStoragePaths(input.paths),
		syncEnabled: input.syncEnabled,
		syncCronExpression,
	};
}
