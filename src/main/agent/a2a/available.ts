import { safeStorage } from 'electron';

export function isA2aSecureStorageAvailable(platform: NodeJS.Platform = process.platform): boolean {
	return (
		safeStorage.isEncryptionAvailable() &&
		(platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text')
	);
}
