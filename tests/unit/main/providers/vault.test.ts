import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import Store from 'electron-store';
import { openProviderCredential } from '../../../../src/main/providers/open';
import type {
	ProviderVaultStoreState,
	VaultSafeStorage,
} from '../../../../src/main/providers/providers_types';
import { restrictProviderPermissions } from '../../../../src/main/providers/restrict';
import { sealProviderCredential } from '../../../../src/main/providers/seal';
import { unwrapProviderDataKey } from '../../../../src/main/providers/unwrap';
import { ProviderVault } from '../../../../src/main/providers/vault';
import { wrapProviderDataKey } from '../../../../src/main/providers/wrap';

jest.setTimeout(30_000);

const defaults: ProviderVaultStoreState = {
	schemaVersion: 1,
	vaultId: '',
	deviceId: '',
	records: {},
};

function secureStorage(available = true, backend = 'gnome_libsecret'): VaultSafeStorage {
	return {
		isEncryptionAvailable: () => available,
		getSelectedStorageBackend: () => backend,
		encryptString: (value) => Buffer.from(`sealed:${value}`, 'utf8'),
		decryptString: (value) => value.toString('utf8').replace(/^sealed:/, ''),
	};
}

function provider(apiKey = 'provider-secret') {
	return {
		id: 'openai',
		name: 'OpenAI',
		apiKey,
		baseUrl: 'https://api.openai.com/v1',
	};
}

function memoryStore(): Store<ProviderVaultStoreState> {
	const store = new Store<ProviderVaultStoreState>({ defaults });
	Object.defineProperty(store, 'path', { configurable: true, value: undefined });
	return store;
}

describe('provider credential crypto', () => {
	it('round-trips and authenticates the vault, kind, id, and schema', () => {
		const key = randomBytes(32);
		const record = sealProviderCredential(provider(), key, {
			vaultId: randomUUID(),
			kind: 'models',
			providerId: 'openai',
			schemaVersion: 1,
			keyVersion: 1,
			clientModifiedAt: new Date().toISOString(),
			writerDeviceId: randomUUID(),
		});

		expect(openProviderCredential(record, key)).toEqual(provider());
		expect(() => openProviderCredential(record, randomBytes(32))).toThrow();
		expect(() => openProviderCredential({ ...record, providerId: 'other' }, key)).toThrow();
		expect(() => openProviderCredential({ ...record, tag: Buffer.alloc(16).toString('base64') }, key)).toThrow();
	});

	it('uses a fresh 96-bit nonce for every encrypted write', () => {
		const key = randomBytes(32);
		const metadata = {
			vaultId: randomUUID(),
			kind: 'models' as const,
			providerId: 'openai',
			schemaVersion: 1,
			keyVersion: 1,
			clientModifiedAt: new Date().toISOString(),
			writerDeviceId: randomUUID(),
		};
		const first = sealProviderCredential(provider(), key, metadata);
		const second = sealProviderCredential(provider(), key, metadata);

		expect(Buffer.from(first.nonce, 'base64')).toHaveLength(12);
		expect(Buffer.from(first.tag, 'base64')).toHaveLength(16);
		expect(second.nonce).not.toBe(first.nonce);
	});

	it('unwraps only with the separate sync passphrase', async () => {
		const key = randomBytes(32);
		const vaultId = randomUUID();
		const envelope = await wrapProviderDataKey(key, 'correct horse battery staple', vaultId);

		await expect(
			unwrapProviderDataKey(envelope, 'correct horse battery staple', vaultId)
		).resolves.toEqual(key);
		await expect(unwrapProviderDataKey(envelope, 'incorrect passphrase', vaultId)).rejects.toThrow();
	});
});

describe('local provider vault', () => {
	it('persists encrypted records without plaintext key material', () => {
		const store = memoryStore();
		const vault = new ProviderVault(store, secureStorage(), 'darwin');

		vault.save('models', provider());

		expect(vault.get('models', 'openai')).toEqual(provider());
		expect(JSON.stringify(store.store)).not.toContain('provider-secret');
		expect(JSON.stringify(store.store)).not.toContain('https://api.openai.com/v1');
		expect(store.store.protectedKey).toEqual(expect.any(String));
	});

	it('migrates idempotently only after a verifiable encrypted write', () => {
		const store = memoryStore();
		const vault = new ProviderVault(store, secureStorage(), 'darwin');

		expect(vault.migrate('models', provider())).toBe(true);
		const first = structuredClone(store.store);
		expect(vault.migrate('models', provider())).toBe(true);

		expect(store.store).toEqual(first);
		expect(vault.get('models', 'openai')).toEqual(provider());
	});

	it('does not replace an unreadable protected key or overwrite encrypted records', () => {
		const store = memoryStore();
		new ProviderVault(store, secureStorage(), 'darwin').save('models', provider());
		const persisted = structuredClone(store.store);
		const unreadableStorage = {
			...secureStorage(),
			decryptString: () => {
				throw new Error('unreadable');
			},
		};
		const lockedVault = new ProviderVault(store, unreadableStorage, 'darwin');

		expect(() => lockedVault.save('databases', { ...provider(), id: 'pinecone' })).toThrow(
			'cannot be opened'
		);
		expect(store.store).toEqual(persisted);
	});

	it.each([
		['unavailable encryption', secureStorage(false), 'darwin' as const],
		['Linux basic_text', secureStorage(true, 'basic_text'), 'linux' as const],
	])('keeps new credentials memory-only with %s', (_name, storage, platform) => {
		const store = memoryStore();
		const vault = new ProviderVault(store, storage, platform);
		vault.save('models', provider());

		expect(vault.persistence).toBe('memory');
		expect(vault.get('models', 'openai')).toEqual(provider());
		expect(store.store.records).toEqual({});
		expect(new ProviderVault(store, storage, platform).get('models', 'openai')).toBeUndefined();
	});

	it('applies private directory and file permissions', () => {
		const directory = mkdtempSync(path.join(os.tmpdir(), 'kucedr-provider-vault-'));
		const file = path.join(directory, 'provider-vault.json');
		try {
			writeFileSync(file, '{}', { mode: 0o666 });
			restrictProviderPermissions(directory, file);

			expect(statSync(directory).mode & 0o777).toBe(0o700);
			expect(statSync(file).mode & 0o777).toBe(0o600);
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
});
