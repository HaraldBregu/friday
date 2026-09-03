import type { VaultSafeStorage } from './providers_types';
import { isSafeStorageAvailable } from '../shared/safe_storage';

export function isProviderSafeStorageAvailable(
	storage?: VaultSafeStorage,
	platform: NodeJS.Platform = process.platform
): boolean {
	return isSafeStorageAvailable(storage, platform);
}
