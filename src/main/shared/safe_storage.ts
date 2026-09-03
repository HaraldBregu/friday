import { safeStorage } from 'electron';

interface SafeStorageAvailability {
	isEncryptionAvailable(): boolean;
	getSelectedStorageBackend(): string;
}

export function isSafeStorageAvailable(
	storage: SafeStorageAvailability = safeStorage,
	platform: NodeJS.Platform = process.platform
): boolean {
	return (
		storage.isEncryptionAvailable() &&
		(platform !== 'linux' || storage.getSelectedStorageBackend() !== 'basic_text')
	);
}
