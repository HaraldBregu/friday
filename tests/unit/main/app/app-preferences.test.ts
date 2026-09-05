import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AppWindowPreferences } from '../../../../src/main/apps/app_preferences';
import { APP_WINDOW_DEFAULTS } from '../../../../src/shared/app_window_settings';
import { isAppWindowSettings } from '../../../../src/shared/app_window_validate';
import { resolveAppWindowSettings } from '../../../../src/shared/app_window_resolve';
import type { App } from '../../../../src/shared/installed_app_types';

describe('app window configuration', () => {
	it.each([
		undefined, null, [], 'large',
		{ width: 0 }, { height: -1 }, { minWidth: 0.5 }, { minHeight: NaN },
		{ width: Infinity }, { height: 32769 },
		{ width: 480, minWidth: 481 }, { height: 320, minHeight: 321 },
		{ resizable: 'false' }, { maximizable: 1 },
		{ webPreferences: { nodeIntegration: true } }, { frame: true },
	])('rejects malformed or unsafe settings: %j', (settings) => {
		expect(isAppWindowSettings(settings)).toBe(false);
	});

	it('accepts partial settings and boundary dimensions', () => {
		expect(isAppWindowSettings({})).toBe(true);
		expect(isAppWindowSettings({ width: 1, height: 32768, resizable: false, maximizable: false })).toBe(true);
		expect(isAppWindowSettings({ width: 480, minWidth: 480 })).toBe(true);
	});

	it('keeps existing defaults and fits omitted minimums to compact windows', () => {
		expect(resolveAppWindowSettings()).toEqual(APP_WINDOW_DEFAULTS);
		expect(resolveAppWindowSettings({ width: 480, height: 320 })).toEqual({
			...APP_WINDOW_DEFAULTS, width: 480, height: 320, minWidth: 480, minHeight: 320,
		});
		expect(resolveAppWindowSettings({ minWidth: 1200, minHeight: 900 })).toMatchObject({
			width: 1200, height: 900, minWidth: 1200, minHeight: 900,
		});
	});

	it('applies saved fields over manifest defaults without conflicting dimensions', () => {
		expect(resolveAppWindowSettings(
			{ width: 1200, height: 900, minWidth: 800, resizable: false },
			{ width: 480, maximizable: false }
		)).toEqual({
			width: 480, height: 900, minWidth: 480, minHeight: 480,
			resizable: false, maximizable: false,
		});
		expect(() => resolveAppWindowSettings({ width: 100, minWidth: 200 })).toThrow('Invalid app window settings');
	});
});

describe('app window preferences', () => {
	let location: string;
	let preferences: AppWindowPreferences;
	const app: App = {
		id: 'notes', title: 'Notes', description: 'A notes app',
		metadata: { version: '1.0.0', category: 'utility', entry: 'index.html' },
		window: { width: 960, height: 720 },
	};

	beforeEach(() => {
		location = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-preferences-'));
		preferences = new AppWindowPreferences(location);
	});

	afterEach(() => {
		fs.rmSync(location, { recursive: true, force: true });
	});

	it('saves preferences for one app without affecting another app', () => {
		expect(preferences.get(app)).toMatchObject({ width: 960, height: 720 });
		const saved = preferences.set(app, { width: 480, height: 320, resizable: false });
		expect(saved).toMatchObject({ width: 480, height: 320, minWidth: 480, minHeight: 320, resizable: false });
		expect(preferences.get(app)).toEqual(saved);
		expect(preferences.get({ ...app, id: 'calendar' })).toMatchObject({ width: 960, height: 720, resizable: true });
	});

	it('resets saved preferences to the current manifest settings', () => {
		preferences.set(app, { width: 480, resizable: false });
		const updated = { ...app, window: { width: 1200, height: 900 } };
		expect(preferences.get(updated)).toMatchObject({ width: 480, height: 900, resizable: false });
		expect(preferences.set(updated, {})).toMatchObject({ width: 1200, height: 900, resizable: true });
		expect(preferences.get(updated)).toMatchObject({ width: 1200, height: 900, resizable: true });
	});

	it('rejects invalid updates without replacing saved settings', () => {
		const saved = preferences.set(app, { width: 800 });
		expect(() => preferences.set(app, { width: 400, minWidth: 500 })).toThrow('Invalid app window settings');
		expect(() => preferences.set(app, { transparent: false })).toThrow('Invalid app window settings');
		expect(preferences.get(app)).toEqual(saved);
	});

	it('rejects app identifiers outside the preferences directory', () => {
		expect(() => preferences.get({ ...app, id: '../outside' })).toThrow('Invalid app ID');
		expect(() => preferences.set({ ...app, id: '../outside' }, {})).toThrow('Invalid app ID');
	});
});
