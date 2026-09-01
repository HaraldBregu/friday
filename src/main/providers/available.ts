import { safeStorage } from 'electron';
import type { VaultSafeStorage } from './providers_types';

export function isProviderSafeStorageAvailable(
	storage: VaultSafeStorage = safeStorage,
	platform: NodeJS.Platform = process.platform
): boolean {
	return (
		storage.isEncryptionAvailable() &&
		(platform !== 'linux' || storage.getSelectedStorageBackend() !== 'basic_text')
	);
}
