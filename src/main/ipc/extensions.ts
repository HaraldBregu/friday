import { dialog } from 'electron';
import type { EventBus } from '../event_bus';
import type { WindowFactory } from '../window_factory';
import type { ExtensionRegistry } from '../extensions/extension_registry';
import {
	deleteExtension,
	destroyExtension,
	importExtensions,
	listExtensions,
	loadExtension,
	openRoot,
} from '../extensions/extension_index';
import { ExtensionChannels } from '../../shared/ipc_channels_definitions';
import type { ExtensionImportResult } from '../../shared/extension_types';
import { registerCommandWithEvent, registerQueryWithEvent } from './core/gateway';
import type { IpcModule } from './core/module';
import type { WindowContextManager } from '../window_context';
import { TrustedRenderer } from './core/trusted';

export interface ExtensionsIpcDeps {
	windowFactory: WindowFactory;
	extensionRegistry: ExtensionRegistry;
	windows: WindowContextManager;
}

export class ExtensionsIpc implements IpcModule<ExtensionsIpcDeps> {
	readonly name = 'extensions';

	register(
		{ windowFactory, extensionRegistry, windows }: ExtensionsIpcDeps,
		_eventBus: EventBus
	): void {
		const trusted = new TrustedRenderer(windows, extensionRegistry);
		registerQueryWithEvent(ExtensionChannels.list, (event) => {
			trusted.assert(event);
			return listExtensions();
		});
		registerCommandWithEvent(ExtensionChannels.open, (event, extensionId: string) => {
			trusted.assert(event);
			const extension = listExtensions().find((item) => item.id === extensionId);
			if (!extension) throw new Error(`Extension not found: ${extensionId}`);
			loadExtension(windowFactory, extension);
		});
		registerCommandWithEvent(ExtensionChannels.openRoot, (event) => {
			trusted.assert(event);
			return openRoot();
		});
		registerCommandWithEvent(ExtensionChannels.delete, async (event, extensionId) => {
			const window = trusted.assert(event);
			const extension = listExtensions().find((item) => item.id === extensionId);
			if (!extension) throw new Error(`Extension not found: ${extensionId}`);
			const options = {
				type: 'warning' as const,
				title: 'Delete Extension',
				buttons: ['Cancel', 'Delete Extension'],
				cancelId: 0,
				defaultId: 0,
				noLink: true,
				message: `Delete “${extension.title}”?`,
				detail: 'This permanently deletes the extension from Friday. This action cannot be undone.',
			};
			const result = await dialog.showMessageBox(window, options);
			if (result.response !== 1) return false;
			destroyExtension(extensionId);
			extensionRegistry.revoke(extensionId);
			deleteExtension(extensionId);
			return true;
		});
		registerCommandWithEvent(
			ExtensionChannels.import,
			async (event): Promise<ExtensionImportResult | undefined> => {
				const window = trusted.assert(event);
				const result = await dialog.showOpenDialog(window, {
							title: 'Select extension folder(s)',
							properties: ['openDirectory', 'multiSelections'],
						});

				if (result.canceled || result.filePaths.length === 0) return undefined;
				return importExtensions(result.filePaths);
			}
		);
	}
}
