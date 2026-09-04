import type { WebContents } from 'electron';
import { isAppId } from './app_id';

type AppWebContents = Pick<WebContents, 'id' | 'once'>;

interface AppRegistration {
	webContents: AppWebContents;
	appId: string;
}

export class AppRegistry {
	private readonly apps = new Map<number, AppRegistration>();

	register(webContents: AppWebContents, appId: string): void {
		if (!Number.isInteger(webContents.id) || webContents.id <= 0) {
			throw new Error('Invalid app web contents ID.');
		}
		if (!isAppId(appId)) throw new Error('Invalid app ID.');

		const registered = this.apps.get(webContents.id);
		if (registered?.webContents === webContents && registered.appId === appId) return;
		if (registered) {
			throw new Error('App web contents is already registered.');
		}

		const unregister = (): void => this.unregister(webContents);
		this.apps.set(webContents.id, { webContents, appId });
		webContents.once('render-process-gone', unregister);
		webContents.once('destroyed', unregister);
	}

	unregister(webContents: Pick<WebContents, 'id'>): void {
		if (this.apps.get(webContents.id)?.webContents !== webContents) return;
		this.apps.delete(webContents.id);
	}

	has(webContents: Pick<WebContents, 'id'>): boolean {
		return this.apps.get(webContents.id)?.webContents === webContents;
	}

	revoke(appId: string): void {
		if (!isAppId(appId)) throw new Error('Invalid app ID.');
		for (const [webContentsId, registration] of this.apps) {
			if (registration.appId === appId) this.apps.delete(webContentsId);
		}
	}

	resolve(webContents: Pick<WebContents, 'id'>): string {
		const registered = this.apps.get(webContents.id);
		if (!registered || registered.webContents !== webContents) {
			throw new Error('App storage is only available to registered app views.');
		}
		return registered.appId;
	}
}
