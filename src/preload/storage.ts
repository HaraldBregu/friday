import { typedInvokeUnwrap } from '../shared/ipc_types';
import { StorageChannels } from '../shared/ipc_channels_definitions';
import type { StorageApi } from './index.d';

export const storage: StorageApi = {
	getStorages: () => typedInvokeUnwrap(StorageChannels.getStorages),
	getStorageConfiguration: () => typedInvokeUnwrap(StorageChannels.getStorageConfiguration),
	saveStorageConfiguration: (configuration) =>
		typedInvokeUnwrap(StorageChannels.saveStorageConfiguration, configuration),
	saveStorageConfig: (config) => typedInvokeUnwrap(StorageChannels.saveStorageConfig, config),
	deleteStorageConfig: (id) => typedInvokeUnwrap(StorageChannels.deleteStorageConfig, id),
	testConnection: (config) => typedInvokeUnwrap(StorageChannels.testConnection, config),
	syncFolders: () => typedInvokeUnwrap(StorageChannels.syncFolders),
	pickFolders: () => typedInvokeUnwrap(StorageChannels.pickFolders),
	backup: (id) => typedInvokeUnwrap(StorageChannels.backup, id),
	restore: (id) => typedInvokeUnwrap(StorageChannels.restore, id),
};
