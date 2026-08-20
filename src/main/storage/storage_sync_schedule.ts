import cron, { type ScheduledTask } from 'node-cron';
import { isAutoSyncable, runProviderSync } from './storage_auto_sync';
import type { StorageConfig } from '../../shared/storage_types';
import { getStorages } from './storage_store';
import type { StorageSyncLogger } from './storage_sync_types';
import type { StorageOperations } from './storage_operations';

const tasks = new Map<string, ScheduledTask>();
let syncLogger: StorageSyncLogger | undefined;
let syncOperations: StorageOperations | undefined;

export function startStorageSync(logger: StorageSyncLogger, operations: StorageOperations): void {
	syncLogger = logger;
	syncOperations = operations;
	scheduleAll();
}

export function stopStorageSync(): void {
	for (const task of tasks.values()) task.destroy();
	tasks.clear();
	syncLogger = undefined;
	syncOperations = undefined;
}

export function rescheduleStorageSync(): void {
	if (syncLogger) scheduleAll();
}

function scheduleAll(): void {
	for (const task of tasks.values()) task.destroy();
	tasks.clear();
	const logger = syncLogger;
	const operations = syncOperations;
	if (!logger || !operations) return;
	for (const storage of getStorages()) scheduleStorage(storage, logger, operations);
}

function scheduleStorage(
	storage: StorageConfig,
	logger: StorageSyncLogger,
	operations: StorageOperations
): void {
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
				await runProviderSync(storage, logger, operations);
			},
			{ noOverlap: true }
		)
	);
}
