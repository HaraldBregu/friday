import type { StoredProvider } from '../../shared/provider_types';

export type ProvidersStoreState = {
	models: StoredProvider[];
	databases: StoredProvider[];
	search_engines: StoredProvider[];
};
