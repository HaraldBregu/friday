import { existsSync } from 'node:fs';
import type { BrowserWindow } from 'electron';
import type { WindowFactory } from '../window_factory';
import { extensionEntryPath } from './extension_entry';
import { render } from './extension_render';
import type { Extension } from './extension_types';

export function loadExtension(
	windowFactory: WindowFactory,
	extension: Extension,
	appLocation?: string
): BrowserWindow {
	const entry = extensionEntryPath(extension.id, extension.metadata.entry, appLocation);
	if (!existsSync(entry)) throw new Error(`Extension entry not found: ${extension.id}`);
	return render(windowFactory, entry, extension.title, extension.id);
}
