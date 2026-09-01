import type { IpcMainInvokeEvent } from 'electron';
import type { IpcModule } from './core/module';
import type { EventBus } from '../event_bus';
import { registerCommandWithEvent, registerQueryWithEvent } from './core/gateway';
import { StorageChannels } from '../../shared/ipc_channels_definitions';
import {
	getStorageSettings,
	pickFolders,
	rescheduleStorageSync,
	saveStorageSettings,
	syncFolders,
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
		registerQueryWithEvent(StorageChannels.getSettings, (event) => {
			assertAppRenderer(event);
			return getStorageSettings();
		});
		registerCommandWithEvent(StorageChannels.saveSettings, (event, settings) => {
			assertAppRenderer(event);
			if (storageOperations.isRunning()) {
				throw new Error('Storage settings cannot change while a cloud operation is running.');
			}
			const saved = saveStorageSettings(settings);
			rescheduleStorageSync();
			return saved;
		});
		registerQueryWithEvent(StorageChannels.syncFolders, (event) => {
			assertAppRenderer(event);
			return syncFolders();
		});
		registerCommandWithEvent(StorageChannels.pickFolders, (event) => {
			assertAppRenderer(event);
			return pickFolders();
		});
		registerQueryWithEvent(StorageChannels.getOperationStatus, (event) => {
			assertAppRenderer(event);
			return storageOperations.getStatus();
		});
		registerCommandWithEvent(StorageChannels.backup, (event) => {
			assertAppRenderer(event);
			return storageOperations.backup('manual');
		});
		registerCommandWithEvent(StorageChannels.restore, (event) => {
			assertAppRenderer(event);
			return storageOperations.restore();
		});
	}
}
