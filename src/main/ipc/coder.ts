import { BrowserWindow, dialog } from 'electron';
import { CoderChannels } from '../../shared/ipc_channels_definitions';
import { isCoderSettings } from '../../shared/coder_types';
import type { Coder } from '../coder';
import type { EventBus } from '../event_bus';
import {
	registerCommand,
	registerCommandWithEvent,
	registerQuery,
	registerQueryWithEvent,
} from './core/gateway';
import type { IpcModule } from './core/module';

interface CoderIpcDependencies {
	readonly coder: Coder;
}

export class CoderIpc implements IpcModule<CoderIpcDependencies> {
	readonly name = 'coder';

	register({ coder }: CoderIpcDependencies, eventBus: EventBus): void {
		registerQuery(CoderChannels.getSettings, () => coder.getSettings());
		registerCommand(CoderChannels.saveSettings, (settings) => {
			if (!isCoderSettings(settings)) throw new Error('Invalid coder settings.');
			return coder.saveSettings(settings);
		});
		registerQuery(CoderChannels.listModels, () => coder.listModels());
		registerQueryWithEvent(CoderChannels.pickDirectory, async (event) => {
			const window = BrowserWindow.fromWebContents(event.sender);
			if (!window) throw new Error('Directory selection requires an originating window.');
			const result = await dialog.showOpenDialog(window, {
				properties: ['openDirectory', 'createDirectory'],
			});
			return result.canceled ? undefined : result.filePaths[0];
		});
		registerCommandWithEvent(CoderChannels.send, (event, prompt, runId) => {
			const window = BrowserWindow.fromWebContents(event.sender);
			if (!window) throw new Error('Coder request requires an originating window.');
			if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('Invalid coder prompt.');
			if (typeof runId !== 'string' || !runId.trim()) throw new Error('Invalid coder run id.');
			return coder.send(window.id, runId.trim(), prompt.trim(), (responseEvent) => {
				eventBus.sendTo(window.id, CoderChannels.response, responseEvent);
			});
		});
		registerCommandWithEvent(CoderChannels.cancel, (event, runId) => {
			const window = BrowserWindow.fromWebContents(event.sender);
			if (!window) return false;
			if (typeof runId !== 'string' || !runId.trim()) throw new Error('Invalid coder run id.');
			return coder.cancel(runId.trim(), window.id);
		});
		registerCommandWithEvent(CoderChannels.connectCodex, (event) => {
			const window = BrowserWindow.fromWebContents(event.sender);
			if (!window) throw new Error('Codex login requires an originating window.');
			return coder.connectCodex(window.id, (authEvent) => {
				eventBus.sendTo(window.id, CoderChannels.authEvent, authEvent);
			});
		});
		registerCommandWithEvent(CoderChannels.cancelCodexLogin, (event) => {
			const window = BrowserWindow.fromWebContents(event.sender);
			return window ? coder.cancelCodexLogin(window.id) : false;
		});
		registerCommand(CoderChannels.disconnectCodex, () => coder.disconnectCodex());
	}
}
