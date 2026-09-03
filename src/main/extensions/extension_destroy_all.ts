import { openExtensionWindows } from './extension_render';

export function destroyAllExtensions(): void {
	for (const extension of openExtensionWindows.values()) {
		if (!extension.window.isDestroyed()) extension.window.destroy();
	}
}
