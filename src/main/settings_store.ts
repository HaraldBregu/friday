import path from 'node:path';
import Store from 'electron-store';
import type {
	ResolvedProvider,
	StoredProvider,
	StoredProviderKind,
} from '../shared/provider_types';
import type {
	StorageConfig,
	StorageConfiguration,
} from '../shared/storage_types';
import { userDataLocation } from './shared/user_data_location';
import { DEFAULT_SYNC_CRON_EXPRESSION } from './storage/storage_sync_types';
import { normalizeStorageConfig } from './storage/storage_config';
import { normalizeStorageConfiguration } from './storage/storage_configuration';
import { loadStorages } from './models';
import { migrateMcpStoreFromProviders } from './mcp/mcp_store_state';
import type { PersistedTaskState } from './tasks/tasks_types';
import type { AppLanguage, AppTheme } from '../shared/app_types';
import {
	getModelProvidersState,
	setModelProvidersState,
	getDatabaseProvidersState,
	setDatabaseProvidersState,
	getStorageProvidersState,
	setStorageProvidersState,
	type StoredStorage,
} from './providers/providers_index';
import { getRagConfiguration, saveRagConfiguration } from './agent/knowledge/rag/rag_store';

export type AppSettingsState = {
	trayEnabled: boolean;
	keepAwake: boolean;
	language: AppLanguage;
	theme: AppTheme;
	cloud: StorageConfiguration;
};

const APP_SETTINGS_STORE_NAME = 'app';

const DEFAULT_STORAGE_CONFIGURATION: StorageConfiguration = {
	providerId: undefined,
	storageId: undefined,
	paths: [],
	syncEnabled: false,
	syncCronExpression: DEFAULT_SYNC_CRON_EXPRESSION,
};

const DEFAULT_TASK_CONFIGURATION: PersistedTaskState = { schedules: [] };

const DEFAULT_APP_SETTINGS: AppSettingsState = {
	trayEnabled: true,
	keepAwake: false,
	language: 'en',
	theme: 'system',
	cloud: DEFAULT_STORAGE_CONFIGURATION,
};

const settingsDirectory = path.resolve(userDataLocation(), 'settings');

const store = new Store<AppSettingsState>({
	name: APP_SETTINGS_STORE_NAME,
	cwd: settingsDirectory,
	accessPropertiesByDotNotation: false,
	defaults: DEFAULT_APP_SETTINGS,
});

type LegacyAppSettingsState = AppSettingsState & {
	databaseConfiguration?: { providerId?: string; databaseId?: string };
	modelSelections?: {
		embedding?: { providerId: string; modelId: string };
	};
	storageConfiguration?: StorageConfiguration;
};

const persistedSettings = { ...store.store } as LegacyAppSettingsState;
const legacyDatabase = persistedSettings.databaseConfiguration;
const legacyEmbedding = persistedSettings.modelSelections?.embedding;
const legacyStorageConfiguration = persistedSettings.storageConfiguration;
if (legacyDatabase || legacyEmbedding) {
	const configuration = getRagConfiguration();
	const hasRagDatabase = Boolean(configuration.databaseProviderId && configuration.databaseId);
	const hasLegacyDatabase = Boolean(legacyDatabase?.providerId && legacyDatabase.databaseId);
	const hasRagEmbedding = Boolean(
		configuration.embeddingProviderId && configuration.embeddingModelId
	);
	const hasLegacyEmbedding = Boolean(legacyEmbedding?.providerId && legacyEmbedding.modelId);
	saveRagConfiguration({
		...configuration,
		databaseProviderId: hasRagDatabase
			? configuration.databaseProviderId
			: hasLegacyDatabase
				? legacyDatabase?.providerId?.trim() || ''
				: '',
		databaseId: hasRagDatabase
			? configuration.databaseId
			: hasLegacyDatabase
				? legacyDatabase?.databaseId?.trim() || ''
				: '',
		embeddingProviderId: hasRagEmbedding
			? configuration.embeddingProviderId
			: hasLegacyEmbedding
				? legacyEmbedding?.providerId?.trim() || ''
				: '',
		embeddingModelId: hasRagEmbedding
			? configuration.embeddingModelId
			: hasLegacyEmbedding
				? legacyEmbedding?.modelId?.trim() || ''
				: '',
	});
}
migrateMcpStoreFromProviders();
delete persistedSettings.databaseConfiguration;
delete persistedSettings.modelSelections;
if (legacyStorageConfiguration) persistedSettings.cloud = legacyStorageConfiguration;
delete persistedSettings.storageConfiguration;
store.store = {
	...DEFAULT_APP_SETTINGS,
	...persistedSettings,
};

export const appSettingsStorePath = store.path;

const taskConfigurationStore = new Store<PersistedTaskState>({
	name: 'tasks',
	cwd: settingsDirectory,
	accessPropertiesByDotNotation: false,
	defaults: DEFAULT_TASK_CONFIGURATION,
});

export const taskConfigurationStorePath = taskConfigurationStore.path;

export function getTrayEnabled(): boolean {
	return store.get('trayEnabled');
}

export function setTrayEnabled(enabled: boolean): void {
	store.set('trayEnabled', enabled);
}

export function getKeepAwake(): boolean {
	return store.get('keepAwake');
}

export function setKeepAwake(enabled: boolean): void {
	store.set('keepAwake', enabled);
}

export function getLanguage(): AppLanguage {
	return store.get('language');
}

export function setLanguage(language: AppLanguage): void {
	store.set('language', language);
}

export function getTheme(): AppTheme {
	return store.get('theme');
}

export function setTheme(theme: AppTheme): void {
	store.set('theme', theme);
}

function readProviders(kind: StoredProviderKind): StoredProvider[] {
	if (kind === 'models') return getModelProvidersState();
	if (kind === 'databases') return getDatabaseProvidersState();
	if (kind === 'bots') return [];
	return [];
}

export function listProviders(kind?: StoredProviderKind): StoredProvider[] {
	return kind ? readProviders(kind) : [...readProviders('models'), ...readProviders('databases')];
}

export function getProvider(id: string): StoredProvider | undefined {
	return listProviders().find((provider) => provider.id === id);
}

export function hasProvider(id: string): boolean {
	return getProvider(id) !== undefined;
}

export function setProvider(
	provider: StoredProvider,
	kind: StoredProviderKind = 'models'
): StoredProvider {
	if (kind === 'bots') {
		throw new Error('Bot providers are stored in channels settings.');
	}
	const providers = readProviders(kind);
	const index = providers.findIndex((entry) => entry.id === provider.id);
	if (index === -1) providers.push(provider);
	else providers[index] = provider;
	if (kind === 'databases') {
		setDatabaseProvidersState(providers);
	} else {
		setModelProvidersState(providers);
	}
	return provider;
}

export function deleteProvider(id: string): void {
	for (const kind of ['models', 'databases'] as const) {
		const providers = readProviders(kind);
		const remaining = providers.filter((provider) => provider.id !== id);
		if (remaining.length !== providers.length) {
			if (kind === 'databases') {
				setDatabaseProvidersState(remaining);
			} else {
				setModelProvidersState(remaining);
			}
		}
	}
}

export function clearProviders(): void {
	setModelProvidersState([]);
	setDatabaseProvidersState([]);
}

/** The selected provider resolved to the shape model adapters consume. */
export function getResolvedProvider(providerId: string | undefined): ResolvedProvider | undefined {
	if (!providerId) return undefined;
	const provider = getProvider(providerId);
	if (!provider) return undefined;
	return {
		id: providerId,
		apiKey: provider.apiKey,
		baseURL: provider.baseUrl,
	};
}

function toStorageConfig(
	stored: StoredStorage,
	legacy: StorageConfiguration = getStorageConfiguration()
): StorageConfig {
	const fallback = legacy.providerId === stored.id ? legacy : DEFAULT_STORAGE_CONFIGURATION;
	return {
		id: stored.id,
		name: stored.name,
		endpoint: stored.endpoint,
		region: stored.region,
		accessKeyId: stored.accessKeyId,
		secretAccessKey: stored.secretAccessKey,
		bucket: stored.bucket,
		forcePathStyle: stored.forcePathStyle === true,
		paths: Array.isArray(stored.paths) ? stored.paths : fallback.paths,
		syncEnabled:
			typeof stored.syncEnabled === 'boolean' ? stored.syncEnabled : fallback.syncEnabled,
		syncCronExpression:
			typeof stored.syncCronExpression === 'string'
				? stored.syncCronExpression
				: fallback.syncCronExpression,
	};
}

function toStoredStorage(config: StorageConfig): StoredStorage {
	return {
		id: config.id,
		name: config.name,
		endpoint: config.endpoint,
		region: config.region,
		accessKeyId: config.accessKeyId,
		secretAccessKey: config.secretAccessKey,
		bucket: config.bucket,
		forcePathStyle: config.forcePathStyle,
		paths: config.paths,
		syncEnabled: config.syncEnabled,
		syncCronExpression: config.syncCronExpression,
		baseUrl: loadStorages().find((entry) => entry.provider.id === config.id)?.url ?? '',
	};
}

export function getStorages(): StorageConfig[] {
	const configuration = getStorageConfiguration();
	return getStoredStorages().map((storage) => toStorageConfig(storage, configuration));
}

export function getStorage(id: string): StorageConfig | undefined {
	const storage = getStoredStorages().find((storage) => storage.id === id);
	return storage ? toStorageConfig(storage) : undefined;
}

export function saveStorageConfig(config: StorageConfig): StorageConfig {
	const normalized = normalizeStorageConfig(config);
	const saved = toStoredStorage({
		...normalized,
		id: normalized.id || crypto.randomUUID(),
	});
	const storages = getStoredStorages();
	const index = storages.findIndex((storage) => storage.id === saved.id);
	setStorageProvidersState(
		index >= 0
			? storages.map((storage, i) => (i === index ? saved : storage))
			: [...storages, saved]
	);
	const current = getStorageConfiguration();
	if (!current.providerId || current.providerId === saved.id) {
		saveStorageConfiguration({
			...current,
			providerId: saved.id,
			paths: saved.paths ?? [],
			syncEnabled: saved.syncEnabled ?? false,
			syncCronExpression: saved.syncCronExpression ?? DEFAULT_SYNC_CRON_EXPRESSION,
		});
	}
	return toStorageConfig(saved, getStorageConfiguration());
}

export function deleteStorageConfig(id: string): void {
	const configuration = getStorageConfiguration();
	const storages = getStoredStorages().filter((storage) => storage.id !== id);
	setStorageProvidersState(storages);
	if (configuration.providerId === id) {
		saveStorageConfiguration({ ...configuration, providerId: storages[0]?.id });
	}
}

export function getSelectedStorageId(): string | undefined {
	return getStorageConfiguration().providerId;
}

export function setSelectedStorageId(id: string): void {
	saveStorageConfiguration({ ...getStorageConfiguration(), providerId: id });
}

export function getStorageConfiguration(): StorageConfiguration {
	const configuration = {
		...DEFAULT_STORAGE_CONFIGURATION,
		...store.get('cloud'),
	};
	if (
		configuration.providerId &&
		!getStoredStorages().some((storage) => storage.id === configuration.providerId)
	) {
		configuration.providerId = undefined;
		configuration.storageId = undefined;
	}
	return configuration;
}

export function saveStorageConfiguration(
	configuration: StorageConfiguration
): StorageConfiguration {
	const normalized = normalizeStorageConfiguration(configuration);
	if (
		normalized.providerId &&
		!getStoredStorages().some((storage) => storage.id === normalized.providerId)
	) {
		throw new Error(`Storage not found: ${normalized.providerId}`);
	}
	const saved: StorageConfiguration = {
		providerId: normalized.providerId,
		storageId: normalized.providerId
			? loadStorages().find((entry) => entry.provider.id === normalized.providerId)?.id
			: undefined,
		paths: normalized.paths,
		syncEnabled: normalized.syncEnabled,
		syncCronExpression: normalized.syncCronExpression,
	};
	store.set('cloud', saved);
	return saved;
}

function getStoredStorages(): StoredStorage[] {
	const providers = getStorageProvidersState();
	return Array.isArray(providers) ? providers : [];
}

export function getTaskConfiguration(): PersistedTaskState {
	const configuration = taskConfigurationStore.store;
	// Fresh array so in-place mutations never touch the shared defaults object
	return { ...configuration, schedules: [...(configuration.schedules ?? [])] };
}

export function setTaskConfiguration(configuration: PersistedTaskState): void {
	taskConfigurationStore.store = configuration;
}
