import { BrowserWindow, type IpcMainInvokeEvent } from 'electron';
import type { ExtensionRegistry } from '../../extensions/extension_registry';
import type { WindowContextManager } from '../../window_context';

export class TrustedRenderer {
	constructor(
		private readonly windows: WindowContextManager,
		private readonly extensions: ExtensionRegistry
	) {}

	assert(event: IpcMainInvokeEvent): BrowserWindow {
		if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame) {
			throw new Error('Account IPC is restricted to the main frame.');
		}
		if (this.extensions.has(event.sender)) {
			throw new Error('Account IPC is unavailable to extension views.');
		}
		const window = BrowserWindow.fromWebContents(event.sender);
		if (!window || window.webContents !== event.sender || !this.windows.has(window.id)) {
			throw new Error('Account IPC is unavailable to this renderer.');
		}
		return window;
	}

	broadcast(channel: string, data: unknown): void {
		BrowserWindow.getAllWindows().forEach((window) => {
			if (!window.isDestroyed() && this.windows.has(window.id)) {
				window.webContents.send(channel, data);
			}
		});
	}
}
