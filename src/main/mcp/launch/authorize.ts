import { safeStorage } from 'electron';
import type { McpData } from '../../../shared/mcp_types';
import { isSafeStorageAvailable } from '../../shared/safe_storage';
import { restrictSettingsFile } from '../../shared/restrict_settings_file';
import { launchFingerprint } from './fingerprint';
import { launchStore, volatileLaunchGrants } from './store';

export function authorizeMcpLaunch(id: string, data: McpData): void {
	const grants = { ...launchStore.get('grants') };
	delete grants[id];
	volatileLaunchGrants.delete(id);
	if (data.type === 'stdio') {
		const fingerprint = launchFingerprint(data);
		if (isSafeStorageAvailable()) {
			grants[id] = safeStorage
				.encryptString(JSON.stringify({ id, fingerprint }))
				.toString('base64');
		} else {
			volatileLaunchGrants.set(id, fingerprint);
		}
	}
	launchStore.set('grants', grants);
	restrictSettingsFile(launchStore.path);
}
