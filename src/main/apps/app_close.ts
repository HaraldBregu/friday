import { openExtensionWindows } from './extension_render';

export function closeExtension(extensionId: string): boolean {
	const extension = openExtensionWindows.get(extensionId);
	if (!extension || extension.window.isDestroyed()) return false;
	extension.window.close();
	return true;
}
