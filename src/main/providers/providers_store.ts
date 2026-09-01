import path from 'node:path';
import Store from 'electron-store';
import { userDataLocation } from '../shared/user_data_location';
import type { StoredProvider } from '../../shared/provider_types';
import type { ProvidersStoreState } from './providers_types';

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

export function getModelProvidersState(): ProvidersStoreState['models'] {
	return store.get('models').filter(isStoredProvider);
}

export function setModelProvidersState(value: ProvidersStoreState['models']): void {
	store.set('models', value.filter(isStoredProvider));
}

export function getDatabaseProvidersState(): ProvidersStoreState['databases'] {
	return store.get('databases');
}

export function setDatabaseProvidersState(value: ProvidersStoreState['databases']): void {
	store.set('databases', value);
}

export function getSearchEngines(): StoredProvider[] {
	return store.get('search_engines');
}

export function setSearchEngines(value: StoredProvider[]): void {
	store.set('search_engines', value);
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
