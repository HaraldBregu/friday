import { restrictSettingsFile } from '../../shared/restrict_settings_file';
import { launchStore, volatileLaunchGrants } from './store';

export function revokeMcpLaunch(id: string): void {
	const grants = { ...launchStore.get('grants') };
	delete grants[id];
	volatileLaunchGrants.delete(id);
	launchStore.set('grants', grants);
	restrictSettingsFile(launchStore.path);
}
