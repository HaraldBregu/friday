import { safeStorage } from 'electron';
import { isSafeStorageAvailable } from '../../shared/safe_storage';

export function isA2aSecureStorageAvailable(platform: NodeJS.Platform = process.platform): boolean {
	return isSafeStorageAvailable(safeStorage, platform);
}
