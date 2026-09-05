import { safeStorage } from 'electron';
import type { McpData } from '../../../shared/mcp_types';
import { isSafeStorageAvailable } from '../../shared/safe_storage';
import { launchFingerprint } from './fingerprint';
import { launchStore, volatileLaunchGrants } from './store';

export function isMcpLaunchTrusted(id: string, data: McpData): boolean {
	if (data.type !== 'stdio') return true;
	const fingerprint = launchFingerprint(data);
	if (volatileLaunchGrants.get(id) === fingerprint) return true;
	const sealed = launchStore.get('grants')[id];
	if (typeof sealed !== 'string' || !isSafeStorageAvailable()) return false;
	try {
		const grant = JSON.parse(safeStorage.decryptString(Buffer.from(sealed, 'base64')));
		return grant?.id === id && grant?.fingerprint === fingerprint;
	} catch {
		return false;
	}
}
