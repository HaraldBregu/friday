import type { StorageConfig } from '../../shared/storage_types';
import { pushFiles } from './storage_push';
import type { StorageSyncLogger } from './storage_sync_types';

export function isAutoSyncable(storage: StorageConfig): boolean {
	return Boolean(
		storage.bucket &&
		storage.accessKeyId &&
		storage.secretAccessKey &&
		storage.paths.length > 0 &&
		storage.syncEnabled
	);
}

export async function runProviderSync(
	storage: StorageConfig,
	logger: StorageSyncLogger
): Promise<void> {
	try {
		const result = await pushFiles(storage.id);
		const failedSuffix = result.failed.length ? `, ${result.failed.length} failed` : '';
		logger.info(
			'Storage',
			`Auto sync "${storage.name}" uploaded ${result.uploaded.length} file(s)${failedSuffix}`
		);
	} catch (error) {
		logger.error('Storage', `Auto sync failed for "${storage.name}"`, error);
	}
}
