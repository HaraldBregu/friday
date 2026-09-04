import type { IpcMainInvokeEvent } from 'electron';
import { AppChannels } from '../../shared/ipc_channels_definitions';
import type { ExtensionRegistry } from '../extensions/extension_registry';
import type { ExtensionStorage } from '../extensions/extension_store';
import { registerCommandWithEvent, registerQueryWithEvent } from './core/gateway';

export interface ExtensionStoreIpcDeps {
	extensionRegistry: ExtensionRegistry;
	extensionStorage: ExtensionStorage;
}

export function registerExtensionStoreIpc({
	extensionRegistry,
	extensionStorage,
}: ExtensionStoreIpcDeps): void {
	const extensionId = (event: IpcMainInvokeEvent): string =>
		extensionRegistry.resolve(event.sender);

	registerQueryWithEvent(AppChannels.getExtensionStoreValue, (event, key) =>
		extensionStorage.get(extensionId(event), key)
	);
	registerCommandWithEvent(AppChannels.setExtensionStoreValue, (event, key, value) =>
		extensionStorage.set(extensionId(event), key, value)
	);
	registerCommandWithEvent(AppChannels.deleteExtensionStoreValue, (event, key) =>
		extensionStorage.delete(extensionId(event), key)
	);
	registerQueryWithEvent(AppChannels.readExtensionStoreFile, (event, filePath) =>
		extensionStorage.readFile(extensionId(event), filePath)
	);
	registerCommandWithEvent(AppChannels.writeExtensionStoreFile, (event, filePath, data) =>
		extensionStorage.writeFile(extensionId(event), filePath, data)
	);
	registerCommandWithEvent(AppChannels.deleteExtensionStoreFile, (event, filePath) =>
		extensionStorage.deleteFile(extensionId(event), filePath)
	);
}
