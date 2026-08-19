import cron, { type ScheduledTask } from 'node-cron';
import { isAutoSyncable, runProviderSync } from './storage_auto_sync';
import type { StorageConfig } from '../../shared/storage_types';
import { getStorages } from './storage_store';
import type { StorageSyncLogger } from './storage_sync_types';

const tasks = new Map<string, ScheduledTask>();
let syncLogger: StorageSyncLogger | undefined;

export function startStorageSync(logger: StorageSyncLogger): void {
	syncLogger = logger;
	scheduleAll();
}

export function stopStorageSync(): void {
	for (const task of tasks.values()) task.destroy();
	tasks.clear();
	syncLogger = undefined;
}

export function rescheduleStorageSync(): void {
	if (syncLogger) scheduleAll();
}

function scheduleAll(): void {
	for (const task of tasks.values()) task.destroy();
	tasks.clear();
	const logger = syncLogger;
	if (!logger) return;
	for (const storage of getStorages()) scheduleStorage(storage, logger);
}

function scheduleStorage(storage: StorageConfig, logger: StorageSyncLogger): void {
	if (!isAutoSyncable(storage)) return;
	if (!cron.validate(storage.syncCronExpression)) {
		logger.error('Storage', `Invalid sync schedule for "${storage.name}"`);
		return;
	}
	logger.info(
		'Storage',
		`Auto sync "${storage.name}" scheduled with ${storage.syncCronExpression}`
	);
	tasks.set(
		storage.id,
		cron.schedule(
			storage.syncCronExpression,
			async () => {
				await runProviderSync(storage, logger);
			},
			{ noOverlap: true }
		)
	);
}
