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
	pullFiles,
	pushFiles,
	rescheduleStorageSync,
	saveStorageConfig,
	saveStorageConfiguration,
	syncFolders,
	testConnection,
	withStorageLock,
} from '../storage';
import type { ExtensionRegistry } from '../extensions/extension_registry';

export interface StorageIpcDeps {
	extensionRegistry: ExtensionRegistry;
}

export class StorageIpc implements IpcModule<StorageIpcDeps> {
	readonly name = 'storage';

	register({ extensionRegistry }: StorageIpcDeps, _eventBus: EventBus): void {
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
			const saved = saveStorageConfig(config);
			rescheduleStorageSync();
			return saved;
		});
		registerCommandWithEvent(StorageChannels.deleteStorageConfig, (event, id) => {
			assertAppRenderer(event);
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
		registerCommandWithEvent(StorageChannels.backup, (event, id) => {
			assertAppRenderer(event);
			return withStorageLock(id, () => pushFiles(id));
		});
		registerCommandWithEvent(StorageChannels.restore, (event, id) => {
			assertAppRenderer(event);
			return withStorageLock(id, () => pullFiles(id));
		});
	}
}
