import { existsSync } from 'node:fs';
import type { BrowserWindow } from 'electron';
import type { WindowFactory } from '../window_factory';
import { appEntryPath } from './app_entry';
import { render } from './app_render';
import type { App } from './app_types';

export function loadApp(
	windowFactory: WindowFactory,
	app: App,
	appLocation?: string
): BrowserWindow {
	const entry = appEntryPath(app.id, app.metadata.entry, appLocation);
	if (!existsSync(entry)) throw new Error(`App entry not found: ${app.id}`);
	return render(windowFactory, entry, app.title, app.id);
}
