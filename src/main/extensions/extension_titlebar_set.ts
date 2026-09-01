import { WindowChannels } from '../../shared/ipc_channels_definitions';
import type { ExtensionTitlebarOptions } from '../../shared/window_types';
import { openExtensionWindows } from './extension_render';

export function setExtensionTitlebar(
	extensionId: string,
	options: ExtensionTitlebarOptions | null
): void {
	const extensionWindow = openExtensionWindows.get(extensionId);
	if (!extensionWindow || extensionWindow.window.isDestroyed()) return;
	extensionWindow.titlebarOptions = options;
	extensionWindow.window.webContents.send(WindowChannels.titlebarOptionsChanged, options);
}
