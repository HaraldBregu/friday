import { openExtensionWindows } from './extension_render';

export function destroyExtension(extensionId: string): boolean {
	const extension = openExtensionWindows.get(extensionId);
	if (!extension || extension.window.isDestroyed()) return false;
	extension.window.destroy();
	return true;
}
