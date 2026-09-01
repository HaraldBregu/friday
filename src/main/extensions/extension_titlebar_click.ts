import type { WebContents } from 'electron';
import { WindowChannels } from '../../shared/ipc_channels_definitions';
import { openExtensionWindows } from './extension_render';

export function dispatchExtensionTitlebarButton(sender: WebContents, buttonId: string): void {
	for (const extensionWindow of openExtensionWindows.values()) {
		if (extensionWindow.window.webContents !== sender) continue;
		const options = extensionWindow.titlebarOptions;
		const button = [...(options?.leftButtons ?? []), ...(options?.rightButtons ?? [])].find(
			(item) => item.id === buttonId
		);
		if (!button || button.disabled || !extensionWindow.contents?.isDestroyed()) {
			if (button && !button.disabled) {
				extensionWindow.contents?.send(WindowChannels.titlebarButtonClicked, buttonId);
			}
			return;
		}
	}
}
