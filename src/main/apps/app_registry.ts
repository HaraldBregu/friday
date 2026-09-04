import type { WebContents } from 'electron';
import { isExtensionId } from './extension_id';

type ExtensionWebContents = Pick<WebContents, 'id' | 'once'>;

interface ExtensionRegistration {
	webContents: ExtensionWebContents;
	extensionId: string;
}

export class ExtensionRegistry {
	private readonly extensions = new Map<number, ExtensionRegistration>();

	register(webContents: ExtensionWebContents, extensionId: string): void {
		if (!Number.isInteger(webContents.id) || webContents.id <= 0) {
			throw new Error('Invalid extension web contents ID.');
		}
		if (!isExtensionId(extensionId)) throw new Error('Invalid extension ID.');

		const registered = this.extensions.get(webContents.id);
		if (registered?.webContents === webContents && registered.extensionId === extensionId) return;
		if (registered) {
			throw new Error('Extension web contents is already registered.');
		}

		const unregister = (): void => this.unregister(webContents);
		this.extensions.set(webContents.id, { webContents, extensionId });
		webContents.once('render-process-gone', unregister);
		webContents.once('destroyed', unregister);
	}

	unregister(webContents: Pick<WebContents, 'id'>): void {
		if (this.extensions.get(webContents.id)?.webContents !== webContents) return;
		this.extensions.delete(webContents.id);
	}

	has(webContents: Pick<WebContents, 'id'>): boolean {
		return this.extensions.get(webContents.id)?.webContents === webContents;
	}

	revoke(extensionId: string): void {
		if (!isExtensionId(extensionId)) throw new Error('Invalid extension ID.');
		for (const [webContentsId, registration] of this.extensions) {
			if (registration.extensionId === extensionId) this.extensions.delete(webContentsId);
		}
	}

	resolve(webContents: Pick<WebContents, 'id'>): string {
		const registered = this.extensions.get(webContents.id);
		if (!registered || registered.webContents !== webContents) {
			throw new Error('Extension storage is only available to registered extension views.');
		}
		return registered.extensionId;
	}
}
