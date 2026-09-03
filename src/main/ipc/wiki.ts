import { BrowserWindow, dialog, shell } from 'electron';
import { mkdir } from 'node:fs/promises';
import type { EventBus } from '../event_bus';
import { WikiChannels } from '../../shared/ipc_channels_definitions';
import {
	cancelWiki,
	getWikiSettings,
	getWikiStatus,
	runWiki,
	saveWikiSettings,
} from '../agent/knowledge/wiki';
import type { IpcModule } from './core/module';
import type { ExtensionRegistry } from '../extensions/extension_registry';
import type { WindowContextManager } from '../window_context';
import { TrustedRenderer } from './core/trusted';

export interface WikiIpcDependencies {
	windows: WindowContextManager;
	extensions: ExtensionRegistry;
}

export class WikiIpc implements IpcModule<WikiIpcDependencies> {
	readonly name = 'wiki';

	register({ windows, extensions }: WikiIpcDependencies, _eventBus: EventBus): void {
		const trusted = new TrustedRenderer(windows, extensions);
		trusted.query(WikiChannels.getSettings, () => getWikiSettings());
		trusted.query(WikiChannels.getStatus, () => getWikiStatus());
		trusted.command(WikiChannels.saveSettings, (settings) => saveWikiSettings(settings));
		trusted.command(WikiChannels.run, () => runWiki());
		trusted.command(WikiChannels.cancel, () => cancelWiki());
		trusted.commandWithEvent(WikiChannels.pickDirectory, async (event, kind) => {
			const settings = getWikiSettings();
			const options = {
				defaultPath: kind === 'source' ? settings.sourcePath : settings.targetPath,
				properties: ['openDirectory' as const, 'createDirectory' as const],
			};
			const window = BrowserWindow.fromWebContents(event.sender);
			const result = await (window
				? dialog.showOpenDialog(window, options)
				: dialog.showOpenDialog(options));
			return result.canceled ? undefined : result.filePaths[0];
		});
		trusted.command(WikiChannels.openDirectory, async (kind) => {
			const settings = getWikiSettings();
			const target = kind === 'source' ? settings.sourcePath : settings.targetPath;
			await mkdir(target, { recursive: true });
			const error = await shell.openPath(target);
			if (error) throw new Error(error);
		});
	}
}
