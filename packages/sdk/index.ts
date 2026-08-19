import type { AgentApi, AppApi, WindowApi } from '../../src/shared/api_types';

export {
	connect,
	type ConnectOptions,
	type FridayClient,
	type RemoteAppApi,
	type WorkspaceAgentApi,
} from './connect';
export type { AgentApi, AppApi, WindowApi } from '../../src/shared/api_types';
export type {
	AppLanguage,
	AppTheme,
	AppThemeColors,
	AppThemeData,
} from '../../src/shared/app_types';
export type { UrlMetadata } from '../../src/shared/app_types';
export type { WorkspaceChangeEvent, WorkspaceTreeEntry } from '../../src/shared/agent_types';
export {
	workspaceFileType,
	type WorkspaceAsset,
	type WorkspaceFileKind,
	type WorkspaceFileType,
} from '../../src/shared/workspace';
export type { ContextMenuDescriptor, ContextMenuRole } from '../../src/shared/window_types';
export type {
	ExtensionStorageApi,
	ExtensionStoreValue,
} from '../../src/shared/extension_store_types';
export { isExtensionStoreValue } from '../../src/shared/extension_store_value';

// Typed lazy views over the host preload globals.
function bridge<T extends object>(name: string): T {
	return new Proxy({} as T, {
		get(_target, key) {
			const api = (globalThis as Record<string, unknown>)[name] as
				| Record<string | symbol, unknown>
				| undefined;
			if (!api)
				throw new Error(
					`@friday/sdk: "${name}" is unavailable — this code must run inside the Friday app.`
				);
			if (!(key in api)) {
				throw new Error(
					`@friday/sdk: "${name}.${String(key)}" is unavailable — update the Friday host.`
				);
			}
			const value = api[key];
			return typeof value === 'function' ? value.bind(api) : value;
		},
	});
}

export const app = bridge<AppApi>('app');
export const agent = bridge<AgentApi>('agent');
export const win = bridge<WindowApi>('win');

const requiredMethods = [
	'getThemeData',
	'setTheme',
	'getLanguage',
	'setLanguage',
	'onThemeModeChanged',
] as const;

function hasAppMethods(api: unknown): api is AppApi {
	if (typeof api !== 'object' || api === null) return false;
	for (const method of requiredMethods) {
		if (typeof (api as Record<string, unknown>)[method] !== 'function') return false;
	}
	return true;
}

export function isFriday(): boolean {
	const fridayApp = (globalThis as Record<string, unknown>).app;
	return hasAppMethods(fridayApp);
}
