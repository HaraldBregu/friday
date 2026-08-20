import type { StorageConfig } from '../../shared/storage_types';
import type { StorageOperations } from './storage_operations';
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
	logger: StorageSyncLogger,
	operations: StorageOperations
): Promise<void> {
	try {
		const started = operations.backup(storage.id, 'scheduled');
		if (started.trigger !== 'scheduled') {
			logger.info('Storage', `Auto sync "${storage.name}" skipped; backup already running`);
			return;
		}
		const result = await operations.wait(started.operationId);
		if (!result) throw new Error('Storage operation status was lost.');
		const failedSuffix = result.failed ? `, ${result.failed} failed` : '';
		logger.info(
			'Storage',
			`Auto sync "${storage.name}" uploaded ${result.transferred} file(s)${failedSuffix}`
		);
	} catch (error) {
		logger.error('Storage', `Auto sync failed for "${storage.name}"`, error);
	}
}
