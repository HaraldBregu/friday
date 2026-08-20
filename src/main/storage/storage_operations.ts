import { randomUUID } from 'node:crypto';
import type {
	StorageOperation,
	StorageOperationStatus,
	StorageOperationTrigger,
	StoragePullResult,
	StoragePushResult,
} from '../../shared/storage_types';
import { describeStorageError } from './storage_error';
import { withStorageLock } from './storage_lock';
import { pullFiles } from './storage_pull';
import { pushFiles } from './storage_push';
import { preventStorageSuspension } from './storage_suspension';

type StorageTransferResult = StoragePushResult | StoragePullResult;

export interface StorageOperationDependencies {
	backup: (storageId: string) => Promise<StoragePushResult>;
	restore: (storageId: string) => Promise<StoragePullResult>;
	lock: <T>(storageId: string, operation: () => Promise<T>) => Promise<T>;
	preventSuspension: () => () => void;
}

const defaultDependencies: StorageOperationDependencies = {
	backup: pushFiles,
	restore: pullFiles,
	lock: withStorageLock,
	preventSuspension: preventStorageSuspension,
};

export class StorageOperations {
	private readonly statuses = new Map<string, StorageOperationStatus>();
	private readonly tasks = new Map<string, Promise<StorageOperationStatus>>();
	private revision = 0;

	constructor(
		private readonly onStatusChanged: (status: StorageOperationStatus) => void,
		private readonly dependencies: StorageOperationDependencies = defaultDependencies
	) {}

	getStatuses(): StorageOperationStatus[] {
		return [...this.statuses.values()];
	}

	getStatus(storageId: string): StorageOperationStatus | undefined {
		return this.statuses.get(storageId);
	}

	isRunning(storageId: string): boolean {
		return this.statuses.get(storageId)?.state === 'running';
	}

	backup(storageId: string, trigger: StorageOperationTrigger): StorageOperationStatus {
		return this.start(storageId, 'backup', trigger);
	}

	restore(storageId: string): StorageOperationStatus {
		return this.start(storageId, 'restore', 'manual');
	}

	wait(operationId: string): Promise<StorageOperationStatus | undefined> {
		return this.tasks.get(operationId) ?? Promise.resolve(undefined);
	}

	private start(
		storageId: string,
		operation: StorageOperation,
		trigger: StorageOperationTrigger
	): StorageOperationStatus {
		const current = this.statuses.get(storageId);
		if (current?.state === 'running') {
			if (current.operation === operation) return current;
			throw new Error('A cloud operation is already running for this storage.');
		}

		const status: StorageOperationStatus = {
			operationId: randomUUID(),
			storageId,
			operation,
			trigger,
			state: 'running',
			startedAt: new Date().toISOString(),
			transferred: 0,
			skipped: 0,
			failed: 0,
			revision: ++this.revision,
		};
		this.publish(status);
		const task = this.execute(status);
		this.tasks.set(status.operationId, task);
		void task.finally(() => this.tasks.delete(status.operationId));
		return status;
	}

	private async execute(running: StorageOperationStatus): Promise<StorageOperationStatus> {
		const allowSuspension = this.dependencies.preventSuspension();
		try {
			const result: StorageTransferResult =
				running.operation === 'backup'
					? await this.dependencies.lock(running.storageId, () =>
							this.dependencies.backup(running.storageId)
						)
					: await this.dependencies.lock(running.storageId, () =>
							this.dependencies.restore(running.storageId)
						);
			const transferred =
				'uploaded' in result ? result.uploaded.length : result.downloaded.length;
			return this.finish(running, result, transferred);
		} catch (error) {
			return this.publish({
				...running,
				state: 'failed',
				finishedAt: new Date().toISOString(),
				error: describeStorageError(error),
				revision: ++this.revision,
			});
		} finally {
			allowSuspension();
		}
	}

	private finish(
		running: StorageOperationStatus,
		result: StorageTransferResult,
		transferred: number
	): StorageOperationStatus {
		return this.publish({
			...running,
			state: result.failed.length > 0 ? 'partial' : 'succeeded',
			finishedAt: new Date().toISOString(),
			transferred,
			skipped: 'skipped' in result ? result.skipped.length : 0,
			failed: result.failed.length,
			revision: ++this.revision,
		});
	}

	private publish(status: StorageOperationStatus): StorageOperationStatus {
		this.statuses.set(status.storageId, status);
		this.onStatusChanged(status);
		return status;
	}
}
