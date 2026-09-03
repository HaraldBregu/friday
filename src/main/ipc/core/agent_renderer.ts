import type { IpcMainInvokeEvent } from 'electron';
import type { ExtensionRegistry } from '../../extensions/extension_registry';
import type { WindowContextManager } from '../../window_context';
import { TrustedRenderer } from './trusted';

export class AgentRenderer {
	private readonly trusted: TrustedRenderer;

	constructor(
		windows: WindowContextManager,
		private readonly extensions: ExtensionRegistry
	) {
		this.trusted = new TrustedRenderer(windows, extensions);
	}

	assert(event: IpcMainInvokeEvent): Electron.BrowserWindow {
		return this.trusted.assert(event);
	}

	assertWorkspace(event: IpcMainInvokeEvent): void {
		if (!this.extensions.has(event.sender)) {
			this.trusted.assert(event);
			return;
		}
		if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame) {
			throw new Error('Workspace IPC is restricted to the main frame.');
		}
		if (this.extensions.resolve(event.sender) !== 'workspace') {
			throw new Error('Workspace IPC is unavailable to this extension.');
		}
	}
}
