import { safeStorage } from 'electron';

export function isA2aSecureStorageAvailable(): boolean {
	return (
		safeStorage.isEncryptionAvailable() &&
		(process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text')
	);
}
