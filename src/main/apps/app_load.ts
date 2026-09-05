import { existsSync } from 'node:fs';
import type { BrowserWindow } from 'electron';
import type { WindowFactory } from '../window_factory';
import { appEntryPath } from './app_entry';
import { render } from './app_render';
import type { App } from './app_types';
import { readAppManifest } from './app_read';
import { AppWindowPreferences } from './app_preferences';

export function loadApp(
	windowFactory: WindowFactory,
	app: App,
	appLocation?: string
): BrowserWindow {
	const manifest = readAppManifest(app.id, appLocation);
	if (!manifest) throw new Error(`App manifest not found or invalid: ${app.id}`);
	const entry = appEntryPath(app.id, manifest.metadata.entry, appLocation);
	if (!existsSync(entry)) throw new Error(`App entry not found: ${app.id}`);
	const settings = new AppWindowPreferences(appLocation).get({ ...manifest, id: app.id });
	return render(windowFactory, entry, manifest.title, app.id, settings);
}
