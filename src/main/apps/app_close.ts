import { openAppWindows } from './app_render';

export function closeApp(appId: string): boolean {
	const app = openAppWindows.get(appId);
	if (!app || app.window.isDestroyed()) return false;
	app.window.close();
	return true;
}
