import os from 'node:os';
import path from 'node:path';

export interface DataDirectoryOptions {
	readonly env?: NodeJS.ProcessEnv;
	readonly home?: string;
	readonly platform?: NodeJS.Platform;
}

export function kucedrDataDirectory(options: DataDirectoryOptions = {}): string {
	const env = options.env ?? process.env;
	const home = options.home ?? os.homedir();
	const platform = options.platform ?? process.platform;

	if (platform === 'darwin') {
		return path.join(home, 'Library', 'Application Support', 'Kucedr');
	}

	if (platform === 'win32') {
		return path.join(env.APPDATA ?? path.join(home, 'AppData', 'Roaming'), 'Kucedr');
	}

	return path.join(env.XDG_CONFIG_HOME ?? path.join(home, '.config'), 'Kucedr');
}
