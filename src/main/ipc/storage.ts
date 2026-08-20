import type { IpcMainInvokeEvent } from 'electron';
import type { IpcModule } from './core/module';
import type { EventBus } from '../event_bus';
import { registerCommandWithEvent, registerQueryWithEvent } from './core/gateway';
import { StorageChannels } from '../../shared/ipc_channels_definitions';
import {
	deleteStorageConfig,
	getStorageConfiguration,
	getStorages,
	pickFolders,
	rescheduleStorageSync,
	saveStorageConfig,
	saveStorageConfiguration,
	syncFolders,
	testConnection,
} from '../storage';
import type { StorageOperations } from '../storage';
import type { ExtensionRegistry } from '../extensions/extension_registry';

export interface StorageIpcDeps {
	extensionRegistry: ExtensionRegistry;
	storageOperations: StorageOperations;
}

export class StorageIpc implements IpcModule<StorageIpcDeps> {
	readonly name = 'storage';

	register({ extensionRegistry, storageOperations }: StorageIpcDeps, _eventBus: EventBus): void {
		const assertAppRenderer = (event: IpcMainInvokeEvent): void => {
			if (extensionRegistry.has(event.sender)) {
				throw new Error('Cloud storage is unavailable to extension views.');
			}
		};
		registerQueryWithEvent(StorageChannels.getStorages, (event) => {
			assertAppRenderer(event);
			return getStorages();
		});
		registerQueryWithEvent(StorageChannels.getStorageConfiguration, (event) => {
			assertAppRenderer(event);
			return getStorageConfiguration();
		});
		registerCommandWithEvent(StorageChannels.saveStorageConfiguration, (event, configuration) => {
			assertAppRenderer(event);
			const saved = saveStorageConfiguration(configuration);
			rescheduleStorageSync();
			return saved;
		});
		registerCommandWithEvent(StorageChannels.saveStorageConfig, (event, config) => {
			assertAppRenderer(event);
			if (config.id && storageOperations.isRunning(config.id)) {
				throw new Error('Storage settings cannot change while a cloud operation is running.');
			}
			const saved = saveStorageConfig(config);
			rescheduleStorageSync();
			return saved;
		});
		registerCommandWithEvent(StorageChannels.deleteStorageConfig, (event, id) => {
			assertAppRenderer(event);
			if (storageOperations.isRunning(id)) {
				throw new Error('Storage settings cannot change while a cloud operation is running.');
			}
			deleteStorageConfig(id);
			rescheduleStorageSync();
		});
		registerCommandWithEvent(StorageChannels.testConnection, (event, config) => {
			assertAppRenderer(event);
			return testConnection(config);
		});
		registerQueryWithEvent(StorageChannels.syncFolders, (event) => {
			assertAppRenderer(event);
			return syncFolders();
		});
		registerCommandWithEvent(StorageChannels.pickFolders, (event) => {
			assertAppRenderer(event);
			return pickFolders();
		});
		registerQueryWithEvent(StorageChannels.getOperationStatuses, (event) => {
			assertAppRenderer(event);
			return storageOperations.getStatuses();
		});
		registerCommandWithEvent(StorageChannels.backup, (event, id) => {
			assertAppRenderer(event);
			return storageOperations.backup(id, 'manual');
		});
		registerCommandWithEvent(StorageChannels.restore, (event, id) => {
			assertAppRenderer(event);
			return storageOperations.restore(id);
		});
	}
}
