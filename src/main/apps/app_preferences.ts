import path from 'node:path';
import { userDataLocation } from '../shared/user_data_location';
import { AppValueStorage } from './app_values';
import type { App } from './app_types';
import type { ResolvedAppWindowSettings } from '../../shared/app_window_settings';
import { isAppWindowSettings } from '../../shared/app_window_validate';
import { resolveAppWindowSettings } from '../../shared/app_window_resolve';

export class AppWindowPreferences {
	private readonly values: AppValueStorage;

	constructor(location = userDataLocation()) {
		this.values = new AppValueStorage(path.join(location, 'settings', 'apps'));
	}

	get(app: App): ResolvedAppWindowSettings {
		const saved = this.values.get(app.id, 'window');
		return resolveAppWindowSettings(app.window ?? {}, isAppWindowSettings(saved) ? saved : {});
	}

	set(app: App, settings: unknown): ResolvedAppWindowSettings {
		if (!isAppWindowSettings(settings)) throw new Error('Invalid app window settings.');
		const resolved = resolveAppWindowSettings(app.window ?? {}, settings);
		this.values.set(app.id, 'window', settings);
		return resolved;
	}
}
