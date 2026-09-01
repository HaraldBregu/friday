import path from 'node:path';
import Store from 'electron-store';
import { userDataLocation } from '../shared/user_data_location';
import type { ProviderCredentialKind, StoredProvider } from '../../shared/provider_types';
import type { ProviderMetadata, ProvidersStoreState } from './providers_types';
import { restrictProviderPermissions } from './restrict';
import { providerVault } from './vault';

const defaults: ProvidersStoreState = {
	models: [],
	databases: [],
	search_engines: [],
};

const store = new Store<ProvidersStoreState>({
	name: 'providers',
	cwd: path.resolve(userDataLocation(), 'settings'),
	accessPropertiesByDotNotation: false,
	defaults,
});

export const providersStorePath = store.path;

export function getModelProvidersState(): StoredProvider[] {
	migrateSection('models');
	return orderedProviders('models');
}

export function setModelProvidersState(value: StoredProvider[]): void {
	setSection('models', value);
}

export function getDatabaseProvidersState(): StoredProvider[] {
	migrateSection('databases');
	return orderedProviders('databases');
}

export function setDatabaseProvidersState(value: StoredProvider[]): void {
	setSection('databases', value);
}

export function getSearchEngines(): StoredProvider[] {
	migrateSection('search_engines');
	return orderedProviders('search_engines');
}

export function setSearchEngines(value: StoredProvider[]): void {
	setSection('search_engines', value);
}

export function reconcileProviderMetadata(): void {
	for (const kind of ['models', 'databases', 'search_engines'] as const) migrateSection(kind);
	for (const kind of ['models', 'databases', 'search_engines'] as const) {
		const legacy = section(kind).filter(
			(value) => isStoredProvider(value) && !providerVault.hasPersistentRecord(kind, value.id)
		);
		const metadata = providerVault.records().flatMap((record) =>
			record.kind === kind && !record.tombstoneAt ? [{ id: record.providerId }] : []
		);
		writeSection(kind, [...legacy, ...metadata]);
	}
}

function setSection(kind: ProviderCredentialKind, value: StoredProvider[]): void {
	migrateSection(kind);
	const providers = value.filter(isStoredProvider);
	const incomingIds = new Set(providers.map((provider) => provider.id));
	for (const provider of providers) providerVault.save(kind, provider);
	for (const provider of providerVault.list(kind)) {
		if (!incomingIds.has(provider.id)) providerVault.remove(kind, provider.id);
	}
	if (providerVault.persistence === 'encrypted') {
		writeSection(
			kind,
			providers.map((provider) => ({ id: provider.id } satisfies ProviderMetadata))
		);
	}
}

function orderedProviders(kind: ProviderCredentialKind): StoredProvider[] {
	const providers = providerVault.list(kind);
	const byId = new Map(providers.map((provider) => [provider.id, provider]));
	const ordered = section(kind).flatMap((value) => {
		const id = isProviderMetadata(value) ? value.id : isStoredProvider(value) ? value.id : '';
		const provider = byId.get(id);
		if (!provider) return [];
		byId.delete(id);
		return [provider];
	});
	return [...ordered, ...byId.values()];
}

function migrateSection(kind: ProviderCredentialKind): void {
	const values = section(kind);
	let changed = false;
	const migrated = values.map((value) => {
		if (!isStoredProvider(value)) return value;
		if (!providerVault.migrate(kind, value)) return value;
		changed = true;
		return { id: value.id } satisfies ProviderMetadata;
	});
	if (changed) writeSection(kind, migrated);
}

function section(kind: ProviderCredentialKind): unknown[] {
	const value = store.get(kind);
	return Array.isArray(value) ? value : [];
}

function writeSection(kind: ProviderCredentialKind, value: unknown[]): void {
	store.set(kind, value);
	if (typeof store.path === 'string') {
		restrictProviderPermissions(path.dirname(store.path), store.path);
	}
}

function isStoredProvider(value: unknown): value is StoredProvider {
	if (typeof value !== 'object' || value === null) return false;
	const provider = value as Partial<StoredProvider>;
	return (
		typeof provider.id === 'string' &&
		typeof provider.name === 'string' &&
		typeof provider.apiKey === 'string' &&
		typeof provider.baseUrl === 'string'
	);
}

function isProviderMetadata(value: unknown): value is ProviderMetadata {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as Partial<ProviderMetadata>).id === 'string'
	);
}
