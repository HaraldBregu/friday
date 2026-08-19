jest.mock('electron-store', () =>
	jest.fn().mockImplementation(({ defaults }: { defaults: Record<string, unknown> }) => {
		let backing: Record<string, unknown> = { ...defaults };
		return {
			get(key: string) {
				return backing[key];
			},
			set(key: string, value: unknown) {
				backing[key] = value;
			},
			get store() {
				return backing;
			},
			set store(value: Record<string, unknown>) {
				backing = value;
			},
		};
	})
);

jest.mock('../../../../src/main/models', () => ({
	loadDatabases: () => [],
	loadStorages: () => [],
}));

import {
	getTaskConfiguration,
	listProviders,
	getProvider,
	hasProvider,
	setProvider,
	deleteProvider,
	clearProviders,
	deleteStorageConfig,
	getStorageConfiguration,
	getSelectedStorageId,
	getStorages,
	saveStorageConfig,
	setSelectedStorageId,
	setTaskConfiguration,
} from '../../../../src/main/settings_store';
import { getDatabaseConfiguration } from '../../../../src/main/database/database_store';
import type { StoredProvider } from '../../../../src/shared/provider_types';
import type { StorageConfig } from '../../../../src/shared/storage_types';

function provider(id: string, name: string): StoredProvider {
	return { id, name, apiKey: 'k', baseUrl: 'https://api' };
}

beforeEach(() => clearProviders());

describe('providers in app settings', () => {
	it('sets and reads a provider', () => {
		setProvider(provider('openai', 'OpenAI'));
		expect(getProvider('openai')).toEqual(provider('openai', 'OpenAI'));
		expect(hasProvider('openai')).toBe(true);
	});

	it('returns undefined / false for unknown providers', () => {
		expect(getProvider('missing')).toBeUndefined();
		expect(hasProvider('missing')).toBe(false);
	});

	it('stores providers as a list', () => {
		setProvider(provider('a', 'A'));
		setProvider(provider('b', 'B'));
		const list = listProviders();
		expect(Array.isArray(list)).toBe(true);
		expect(list.map((entry) => entry.id)).toEqual(['a', 'b']);
	});

	it('stores database providers in the database configuration', () => {
		setProvider(provider('pinecone', 'Pinecone'), 'databases');

		expect(getDatabaseConfiguration().providers).toEqual([provider('pinecone', 'Pinecone')]);
	});

	it('updates in place instead of appending a duplicate', () => {
		setProvider(provider('openai', 'OpenAI'));
		setProvider({ ...provider('openai', 'OpenAI'), apiKey: 'rotated' });
		expect(listProviders()).toHaveLength(1);
		expect(getProvider('openai')?.apiKey).toBe('rotated');
	});

	it('lists only well-formed provider entries', () => {
		setProvider(provider('good', 'Good'));
		setProvider({ id: 'bad' } as StoredProvider);
		expect(listProviders().map((entry) => entry.id)).toEqual(['good']);
	});

	it('deletes a provider', () => {
		setProvider(provider('x', 'X'));
		deleteProvider('x');
		expect(hasProvider('x')).toBe(false);
	});

	it('deleteProvider is a no-op for unknown ids', () => {
		expect(() => deleteProvider('nope')).not.toThrow();
	});

	it('clears all providers', () => {
		setProvider(provider('a', 'A'));
		clearProviders();
		expect(listProviders()).toEqual([]);
	});
});

describe('storages in app settings', () => {
	const storage = (id: string): StorageConfig => ({
		id,
		name: id,
		endpoint: 'https://storage.example.com',
		region: 'us-east-1',
		accessKeyId: 'access',
		secretAccessKey: 'secret',
		bucket: 'friday',
		forcePathStyle: true,
		paths: ['/data/agent'],
		syncEnabled: true,
		syncCronExpression: '0 3 * * *',
	});

	beforeEach(() => {
		getStorages().forEach((entry) => deleteStorageConfig(entry.id));
	});

	it('round-trips folder sync and cron settings', () => {
		saveStorageConfig(storage('backup'));

		expect(getStorages()).toEqual([storage('backup')]);
		expect(getSelectedStorageId()).toBe('backup');
	});

	it('stores storage providers in the storage configuration', () => {
		saveStorageConfig(storage('backup'));

		expect(getStorageConfiguration().providerId).toBe('backup');
	});

	it('persists the selected storage and falls back after deletion', () => {
		saveStorageConfig(storage('first'));
		saveStorageConfig({
			...storage('second'),
			paths: ['/data/second'],
			syncCronExpression: '0 4 * * *',
		});
		setSelectedStorageId('second');

		expect(getSelectedStorageId()).toBe('second');
		expect(getStorageConfiguration()).toMatchObject({
			paths: ['/data/second'],
			syncCronExpression: '0 4 * * *',
		});
		deleteStorageConfig('second');
		expect(getSelectedStorageId()).toBe('first');
		expect(getStorageConfiguration()).toMatchObject({
			paths: ['/data/agent'],
			syncCronExpression: '0 3 * * *',
		});
	});

	it('rejects an invalid enabled cron schedule', () => {
		expect(() =>
			saveStorageConfig({ ...storage('backup'), syncCronExpression: 'not cron' })
		).toThrow('valid cron expression');
	});
});

describe('cron settings', () => {
	it('preserves the persisted cron structure', () => {
		const state = {
			enabled: true,
			providerId: 'openai',
			modelId: 'gpt-5',
			schedules: [],
		};

		setTaskConfiguration(state);
		expect(getTaskConfiguration()).toEqual(state);
	});
});
