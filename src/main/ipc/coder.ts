import { BrowserWindow, dialog } from 'electron';
import { CoderChannels } from '../../shared/ipc_channels_definitions';
import { isCoderSettings } from '../../shared/coder_types';
import type { Coder } from '../coder';
import type { EventBus } from '../event_bus';
import type { ExtensionRegistry } from '../extensions/extension_registry';
import {
	registerCommandWithEvent,
	registerQueryWithEvent,
} from './core/gateway';
import type { IpcModule } from './core/module';

interface CoderIpcDependencies {
	readonly coder: Coder;
	readonly extensionRegistry: ExtensionRegistry;
}

export class CoderIpc implements IpcModule<CoderIpcDependencies> {
	readonly name = 'coder';

	register({ coder, extensionRegistry }: CoderIpcDependencies, _eventBus: EventBus): void {
		const assertCoderCaller = (event: Electron.IpcMainInvokeEvent): void => {
			if (!extensionRegistry.has(event.sender)) return;
			if (extensionRegistry.resolve(event.sender) !== 'coder') {
				throw new Error('Coder is only available to the Coder extension.');
			}
		};
		const assertHostCaller = (event: Electron.IpcMainInvokeEvent): void => {
			if (extensionRegistry.has(event.sender)) {
				throw new Error('Coder configuration is unavailable to extension views.');
			}
		};

		registerQueryWithEvent(CoderChannels.getSettings, (event) => {
			assertCoderCaller(event);
			return coder.getSettings();
		});
		registerCommandWithEvent(CoderChannels.saveSettings, (event, settings) => {
			assertHostCaller(event);
			if (!isCoderSettings(settings)) throw new Error('Invalid coder settings.');
			return coder.saveSettings(settings);
		});
		registerQueryWithEvent(CoderChannels.listModels, (event) => {
			assertHostCaller(event);
			return coder.listModels();
		});
		registerQueryWithEvent(CoderChannels.pickDirectory, async (event) => {
			assertHostCaller(event);
			const window = BrowserWindow.fromWebContents(event.sender);
			if (!window) throw new Error('Directory selection requires an originating window.');
			const result = await dialog.showOpenDialog(window, {
				properties: ['openDirectory', 'createDirectory'],
			});
			return result.canceled ? undefined : result.filePaths[0];
		});
		registerCommandWithEvent(CoderChannels.send, (event, prompt, runId) => {
			assertCoderCaller(event);
			if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('Invalid coder prompt.');
			if (typeof runId !== 'string' || !runId.trim()) throw new Error('Invalid coder run id.');
			const callerId = event.sender.id;
			const normalizedRunId = runId.trim();
			const cancel = (): void => {
				coder.cancel(normalizedRunId, callerId);
			};
			event.sender.once('destroyed', cancel);
			return coder
				.send(callerId, normalizedRunId, prompt.trim(), (responseEvent) => {
					event.sender.send(CoderChannels.response, responseEvent);
				})
				.finally(() => event.sender.removeListener('destroyed', cancel));
		});
		registerCommandWithEvent(CoderChannels.cancel, (event, runId) => {
			assertCoderCaller(event);
			if (typeof runId !== 'string' || !runId.trim()) throw new Error('Invalid coder run id.');
			return coder.cancel(runId.trim(), event.sender.id);
		});
		registerCommandWithEvent(CoderChannels.connectCodex, (event) => {
			assertHostCaller(event);
			return coder.connectCodex(event.sender.id, (authEvent) => {
				event.sender.send(CoderChannels.authEvent, authEvent);
			});
		});
		registerCommandWithEvent(CoderChannels.cancelCodexLogin, (event) => {
			assertHostCaller(event);
			return coder.cancelCodexLogin(event.sender.id);
		});
		registerCommandWithEvent(CoderChannels.disconnectCodex, (event) => {
			assertHostCaller(event);
			return coder.disconnectCodex();
		});
	}
}
