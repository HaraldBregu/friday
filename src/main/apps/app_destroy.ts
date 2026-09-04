import { openAppWindows } from './app_render';

export function destroyApp(appId: string): boolean {
	const app = openAppWindows.get(appId);
	if (!app || app.window.isDestroyed()) return false;
	app.window.destroy();
	return true;
}
