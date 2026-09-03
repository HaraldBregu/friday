import { safeStorage } from 'electron';

type SafeStorageAvailability = Pick<
	typeof safeStorage,
	'isEncryptionAvailable' | 'getSelectedStorageBackend'
>;

export function isSafeStorageAvailable(
	storage: SafeStorageAvailability = safeStorage,
	platform: NodeJS.Platform = process.platform
): boolean {
	return (
		storage.isEncryptionAvailable() &&
		(platform !== 'linux' || storage.getSelectedStorageBackend() !== 'basic_text')
	);
}
