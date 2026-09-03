import type { AuthState } from '../../shared/auth_types';
import type { StorageOperations } from './storage_operations';
import { startStorageSync, stopStorageSync } from './storage_sync_schedule';
import type { StorageSyncLogger } from './storage_sync_types';

interface StorageAccountState {
	getState(): AuthState;
	onStateChanged(listener: (state: AuthState) => void): () => void;
}

export function bindStorageSyncToAccount(
	auth: StorageAccountState,
	logger: StorageSyncLogger,
	operations: StorageOperations
): () => void {
	const apply = (state: AuthState): void => {
		if (state.status === 'signedIn') startStorageSync(logger, operations);
		else stopStorageSync();
	};
	const unsubscribe = auth.onStateChanged(apply);
	apply(auth.getState());
	return () => {
		unsubscribe();
		stopStorageSync();
	};
}
