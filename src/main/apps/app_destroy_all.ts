import { openAppWindows } from './app_render';

export function destroyAllApps(): void {
	for (const app of openAppWindows.values()) {
		if (!app.window.isDestroyed()) app.window.destroy();
	}
}
