import { BrowserWindow, dialog, shell } from 'electron';
import { CoderChannels } from '../../shared/ipc_channels_definitions';
import { isCoderRunRequest, isCoderSettings } from '../../shared/coder_types';
import type { Coder } from '../coder';
import type { EventBus } from '../event_bus';
import type { ExtensionRegistry } from '../extensions/extension_registry';
import { registerCommandWithEvent, registerQueryWithEvent } from './core/gateway';
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
		registerQueryWithEvent(CoderChannels.getSettings, (event) => {
			assertCoderCaller(event);
			return coder.getSettings();
		});
		registerCommandWithEvent(CoderChannels.saveSettings, (event, settings) => {
			assertCoderCaller(event);
			if (!isCoderSettings(settings)) throw new Error('Invalid coder settings.');
			return coder.saveSettings(settings);
		});
		registerQueryWithEvent(CoderChannels.listModels, (event) => {
			assertCoderCaller(event);
			return coder.listModels();
		});
		registerQueryWithEvent(CoderChannels.listProjects, (event) => {
			assertCoderCaller(event);
			return coder.listProjects();
		});
		registerQueryWithEvent(CoderChannels.addProject, async (event) => {
			assertCoderCaller(event);
			const window = BrowserWindow.fromWebContents(event.sender);
			const options: Electron.OpenDialogOptions = { properties: ['openDirectory'] };
			const result = window
				? await dialog.showOpenDialog(window, options)
				: await dialog.showOpenDialog(options);
			return result.canceled || !result.filePaths[0]
				? undefined
				: coder.addProject(result.filePaths[0]);
		});
		registerCommandWithEvent(CoderChannels.openProject, async (event, projectId) => {
			assertCoderCaller(event);
			if (typeof projectId !== 'string' || !projectId.trim()) {
				throw new Error('Invalid coder project id.');
			}
			const project = coder.listProjects().find((item) => item.id === projectId.trim());
			if (!project || !project.available)
				throw new Error('Coder project directory is unavailable.');
			const error = await shell.openPath(project.directory);
			if (error) throw new Error(error);
		});
		registerCommandWithEvent(CoderChannels.removeProject, (event, projectId) => {
			assertCoderCaller(event);
			if (typeof projectId !== 'string' || !projectId.trim()) {
				throw new Error('Invalid coder project id.');
			}
			return coder.removeProject(projectId.trim());
		});
		registerQueryWithEvent(CoderChannels.listSessions, (event, projectId) => {
			assertCoderCaller(event);
			if (typeof projectId !== 'string' || !projectId.trim()) {
				throw new Error('Invalid coder project id.');
			}
			return coder.listSessions(projectId.trim());
		});
		registerQueryWithEvent(CoderChannels.getSession, (event, projectId, sessionId) => {
			assertCoderCaller(event);
			if (
				typeof projectId !== 'string' ||
				!projectId.trim() ||
				typeof sessionId !== 'string' ||
				!sessionId.trim()
			) {
				throw new Error('Invalid coder session.');
			}
			return coder.getSession(projectId.trim(), sessionId.trim());
		});
		registerCommandWithEvent(CoderChannels.renameSession, (event, projectId, sessionId, title) => {
			assertCoderCaller(event);
			if (
				typeof projectId !== 'string' ||
				!projectId.trim() ||
				typeof sessionId !== 'string' ||
				!sessionId.trim() ||
				typeof title !== 'string' ||
				!title.trim() ||
				title.trim().length > 120
			) {
				throw new Error('Invalid coder session title.');
			}
			return coder.renameSession(projectId.trim(), sessionId.trim(), title.trim());
		});
		registerCommandWithEvent(CoderChannels.deleteSession, (event, projectId, sessionId) => {
			assertCoderCaller(event);
			if (
				typeof projectId !== 'string' ||
				!projectId.trim() ||
				typeof sessionId !== 'string' ||
				!sessionId.trim()
			) {
				throw new Error('Invalid coder session.');
			}
			return coder.deleteSession(projectId.trim(), sessionId.trim());
		});
		registerCommandWithEvent(CoderChannels.send, (event, request, runId) => {
			assertCoderCaller(event);
			if (!isCoderRunRequest(request)) throw new Error('Invalid coder run request.');
			if (typeof runId !== 'string' || !runId.trim()) throw new Error('Invalid coder run id.');
			const callerId = event.sender.id;
			const normalizedRunId = runId.trim();
			const cancel = (): void => {
				coder.cancel(normalizedRunId, callerId);
			};
			event.sender.once('destroyed', cancel);
			return coder
				.send(callerId, normalizedRunId, request, (responseEvent) => {
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
			assertCoderCaller(event);
			const callerId = event.sender.id;
			const cancel = (): void => {
				coder.cancelCodexLogin(callerId);
			};
			event.sender.once('destroyed', cancel);
			return coder
				.connectCodex(callerId, (authEvent) => {
					event.sender.send(CoderChannels.authEvent, authEvent);
				})
				.finally(() => event.sender.removeListener('destroyed', cancel));
		});
		registerCommandWithEvent(CoderChannels.cancelCodexLogin, (event) => {
			assertCoderCaller(event);
			return coder.cancelCodexLogin(event.sender.id);
		});
		registerCommandWithEvent(CoderChannels.disconnectCodex, (event) => {
			assertCoderCaller(event);
			return coder.disconnectCodex();
		});
	}
}
