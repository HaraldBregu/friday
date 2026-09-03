import { decode, encode } from '../../src/shared/api_codec';
import { AgentChannels, AppChannels } from '../../src/shared/ipc_channels_definitions';
import type { AgentApi, AppApi } from '../../src/shared/api_types';
import type { ChannelStatusEvent } from '../../src/shared/channels_types';
import type { AppThemeData } from '../../src/shared/app_types';
import type { ExtensionStorageApi } from '../../src/shared/extension_store_types';
import type { WorkspaceChangeEvent } from '../../src/shared/agent_types';

export type WorkspaceAgentApi = Pick<
	AgentApi,
	| 'getWorkspaceLocation'
	| 'listWorkspaceFiles'
	| 'onWorkspaceChanged'
	| 'readWorkspaceFile'
	| 'readWorkspaceAsset'
	| 'writeWorkspaceFile'
	| 'writeWorkspaceMarkdown'
	| 'createWorkspaceFile'
	| 'createWorkspaceDirectory'
	| 'moveWorkspaceEntry'
	| 'renameWorkspaceEntry'
	| 'deleteWorkspaceFile'
	| 'deleteWorkspaceDirectory'
>;

const extensionStoreAppMethods = {
	getExtensionStoreValue: true,
	setExtensionStoreValue: true,
	deleteExtensionStoreValue: true,
	readExtensionStoreFile: true,
	writeExtensionStoreFile: true,
	deleteExtensionStoreFile: true,
} satisfies Record<keyof ExtensionStorageApi, true>;

type ExtensionStoreAppMethod = keyof typeof extensionStoreAppMethods;
export type RemoteAppApi = Omit<AppApi, ExtensionStoreAppMethod>;

const RemoteAppChannels = Object.fromEntries(
	Object.entries(AppChannels).filter(([method]) => !Object.hasOwn(extensionStoreAppMethods, method))
) as Omit<typeof AppChannels, ExtensionStoreAppMethod>;

export interface ConnectOptions {
	/** Base URL of the Kucedr API. Defaults to `http://127.0.0.1:8765`. */
	url?: string;
	/** Contents of `<userData>/sdk-token` in the Kucedr app data folder. */
	token: string;
	/** Override the fetch implementation (defaults to the global one). */
	fetch?: typeof globalThis.fetch;
}

export interface KucedrClient {
	app: RemoteAppApi;
	agent: WorkspaceAgentApi;
	/** Verify the app is reachable and the token is accepted. */
	ping: () => Promise<{ name: string; version: string }>;
	/** Close the event stream, if one was opened. */
	close: () => void;
}

type Listener = (channel: string, data: unknown) => void;

export function connect(options: ConnectOptions): KucedrClient {
	const base = (options.url ?? 'http://127.0.0.1:8765').replace(/\/$/, '');
	const call = options.fetch ?? globalThis.fetch;
	const headers = { authorization: `Bearer ${options.token}`, 'content-type': 'application/json' };

	const listeners = new Set<Listener>();
	let controller: AbortController | undefined;
	let opened: Promise<void> | undefined;

	const read = async (stream: ReadableStream<Uint8Array>): Promise<void> => {
		const reader = stream.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		for (;;) {
			const { done, value } = await reader.read();
			if (done) return;
			buffer += decoder.decode(value, { stream: true });
			const frames = buffer.split('\n\n');
			buffer = frames.pop() ?? '';
			for (const frame of frames) {
				if (!frame.startsWith('data: ')) continue;
				const event = decode(JSON.parse(frame.slice(6))) as { channel: string; data: unknown };
				for (const listener of listeners) listener(event.channel, event.data);
			}
		}
	};

	const open = (): Promise<void> => {
		if (opened) return opened;
		controller = new AbortController();
		opened = call(`${base}/events`, { headers, signal: controller.signal }).then((response) => {
			if (!response.ok || !response.body)
				throw new Error(`Event stream failed: ${response.status}`);
			void read(response.body).catch(() => undefined);
		});
		return opened;
	};

	const listen = async (listener: Listener): Promise<() => void> => {
		await open();
		listeners.add(listener);
		return (): void => {
			listeners.delete(listener);
		};
	};

	const invoke = async (channel: string, args: unknown[]): Promise<unknown> => {
		const response = await call(`${base}/invoke`, {
			method: 'POST',
			headers,
			body: JSON.stringify(encode({ channel, args })),
		});
		const result = decode(await response.json()) as
			| { success: true; data: unknown }
			| { success: false; error: { message: string } };
		if (!result.success) throw new Error(result.error.message);
		return result.data;
	};

	const namespace = <T>(channels: Record<string, string>, extras: Partial<T> = {}): T =>
		new Proxy(extras as object, {
			get(target, key) {
				if (typeof key !== 'string') return undefined;
				if (key in target) return (target as Record<string, unknown>)[key];
				const channel = channels[key];
				if (!channel) throw new Error(`@kucedr/sdk: "${key}" is not available over the API.`);
				return (...args: unknown[]): Promise<unknown> => invoke(channel, args);
			},
		}) as T;

	return {
		app: namespace<RemoteAppApi>(RemoteAppChannels, {
			onModelsChanged: (callback: () => void) => {
				const pending = listen((channel) => {
					if (channel === AppChannels.modelsChanged) callback();
				});
				return (): void => {
					void pending.then((off) => off());
				};
			},
			onChannelsStatusChanged: (callback: (event: ChannelStatusEvent) => void) => {
				const pending = listen((channel, data) => {
					if (channel === AppChannels.channelsStatusChanged) callback(data as ChannelStatusEvent);
				});
				return (): void => {
					void pending.then((off) => off());
				};
			},
			onThemeModeChanged: (callback: (theme: AppThemeData) => void) => {
				const pending = listen((channel, data) => {
					if (channel === AppChannels.themeModeChanged) callback(data as AppThemeData);
				});
				return (): void => {
					void pending.then((off) => off());
				};
			},
		}),
		agent: {
			onWorkspaceChanged: (callback: (event: WorkspaceChangeEvent) => void) => {
				const pending = listen((channel, data) => {
					if (channel === AgentChannels.workspaceChanged) callback(data as WorkspaceChangeEvent);
				});
				return (): void => {
					void pending.then((off) => off());
				};
			},
			getWorkspaceLocation: () => invoke(AgentChannels.getWorkspaceLocation, []) as Promise<string>,
			listWorkspaceFiles: () =>
				invoke(AgentChannels.listWorkspaceFiles, []) as ReturnType<AgentApi['listWorkspaceFiles']>,
			readWorkspaceFile: (filePath) =>
				invoke(AgentChannels.readWorkspaceFile, [filePath]) as ReturnType<
					AgentApi['readWorkspaceFile']
				>,
			readWorkspaceAsset: (filePath) =>
				invoke(AgentChannels.readWorkspaceAsset, [filePath]) as ReturnType<
					AgentApi['readWorkspaceAsset']
				>,
			writeWorkspaceFile: (filePath, content) =>
				invoke(AgentChannels.writeWorkspaceFile, [filePath, content]) as ReturnType<
					AgentApi['writeWorkspaceFile']
				>,
			writeWorkspaceMarkdown: (filePath, content) =>
				invoke(AgentChannels.writeWorkspaceMarkdown, [filePath, content]) as ReturnType<
					AgentApi['writeWorkspaceMarkdown']
				>,
			createWorkspaceFile: (parentPath, name) =>
				invoke(AgentChannels.createWorkspaceFile, [parentPath, name]) as ReturnType<
					AgentApi['createWorkspaceFile']
				>,
			createWorkspaceDirectory: (parentPath, name) =>
				invoke(AgentChannels.createWorkspaceDirectory, [parentPath, name]) as ReturnType<
					AgentApi['createWorkspaceDirectory']
				>,
			moveWorkspaceEntry: (sourcePath, destinationDirectoryPath) =>
				invoke(AgentChannels.moveWorkspaceEntry, [
					sourcePath,
					destinationDirectoryPath,
				]) as ReturnType<AgentApi['moveWorkspaceEntry']>,
			renameWorkspaceEntry: (sourcePath, name) =>
				invoke(AgentChannels.renameWorkspaceEntry, [sourcePath, name]) as ReturnType<
					AgentApi['renameWorkspaceEntry']
				>,
			deleteWorkspaceFile: (filePath) =>
				invoke(AgentChannels.deleteWorkspaceFile, [filePath]) as ReturnType<
					AgentApi['deleteWorkspaceFile']
				>,
			deleteWorkspaceDirectory: (directoryPath) =>
				invoke(AgentChannels.deleteWorkspaceDirectory, [directoryPath]) as ReturnType<
					AgentApi['deleteWorkspaceDirectory']
				>,
		},
		ping: async () => {
			const response = await call(`${base}/health`, { headers });
			if (!response.ok) throw new Error(`Kucedr API unreachable: ${response.status}`);
			return (await response.json()) as { name: string; version: string };
		},
		close: () => {
			listeners.clear();
			controller?.abort();
			controller = undefined;
			opened = undefined;
		},
	};
}
