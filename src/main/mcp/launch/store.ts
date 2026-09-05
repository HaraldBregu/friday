import path from 'node:path';
import Store from 'electron-store';
import { userDataLocation } from '../../shared/user_data_location';
import { restrictSettingsFile } from '../../shared/restrict_settings_file';

export const launchStore = new Store<{ grants: Record<string, string> }>({
	name: 'mcp-launch-trust',
	cwd: path.resolve(userDataLocation(), 'settings'),
	accessPropertiesByDotNotation: false,
	defaults: { grants: {} },
});
export const volatileLaunchGrants = new Map<string, string>();
restrictSettingsFile(launchStore.path);
