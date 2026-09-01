import Store from 'electron-store';
import type { AuthState } from '../../../../src/shared/auth_types';
import type { ProviderCloudPort, ProviderVaultCloudRecord } from '../../../../src/main/providers/remote';
import type {
	ProviderKeyEnvelope,
	ProviderVaultRecord,
	ProviderVaultStoreState,
	VaultSafeStorage,
} from '../../../../src/main/providers/providers_types';
import { ProviderSyncService } from '../../../../src/main/providers/sync';
import { ProviderVault } from '../../../../src/main/providers/vault';

jest.setTimeout(30_000);

const defaults: ProviderVaultStoreState = {
	schemaVersion: 1,
	vaultId: '',
	deviceId: '',
	records: {},
};

const storage: VaultSafeStorage = {
	isEncryptionAvailable: () => true,
	getSelectedStorageBackend: () => 'keychain',
	encryptString: (value) => Buffer.from(`sealed:${value}`),
	decryptString: (value) => value.toString().replace(/^sealed:/, ''),
};

class FakeAuth {
	state: AuthState = {
		status: 'signedIn',
		persistence: 'encrypted',
		user: { id: '11111111-1111-4111-8111-111111111111', email: 'owner@example.test' },
	};
	private listeners = new Set<(state: AuthState) => void>();

	getState(): AuthState {
		return structuredClone(this.state);
	}

	onStateChanged(listener: (state: AuthState) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	getClient(): never {
		throw new Error('unused');
	}
}

class FakeCloud implements ProviderCloudPort {
	vault?: ProviderVaultCloudRecord;
	records = new Map<string, ProviderVaultRecord>();
	fail = false;

	async getVault(): Promise<ProviderVaultCloudRecord | undefined> {
		this.check();
		return this.vault ? structuredClone(this.vault) : undefined;
	}

	async createVault(vaultId: string, envelope: ProviderKeyEnvelope): Promise<void> {
		this.check();
		if (this.vault) throw new Error('exists');
		this.vault = { vaultId, ...structuredClone(envelope) };
	}

	async updateVault(vaultId: string, envelope: ProviderKeyEnvelope): Promise<void> {
		this.check();
		this.vault = { vaultId, ...structuredClone(envelope) };
	}

	async listCredentials(): Promise<ProviderVaultRecord[]> {
		this.check();
		return structuredClone([...this.records.values()]);
	}

	async syncCredential(record: ProviderVaultRecord): Promise<ProviderVaultRecord> {
		this.check();
		const key = `${record.kind}:${record.providerId}`;
		const current = this.records.get(key);
		const winner = !current || this.compare(record, current) > 0 ? record : current;
		const canonical = {
			...structuredClone(winner),
			dirty: false,
			serverRevision:
				winner === record && winner !== current
					? (current?.serverRevision ?? 0) + 1
					: (current?.serverRevision ?? 1),
			serverModifiedAt: new Date().toISOString(),
		};
		this.records.set(key, canonical);
		return structuredClone(canonical);
	}

	private compare(left: ProviderVaultRecord, right: ProviderVaultRecord): number {
		const time = Date.parse(left.clientModifiedAt) - Date.parse(right.clientModifiedAt);
		return time || left.writerDeviceId.localeCompare(right.writerDeviceId);
	}

	private check(): void {
		if (this.fail) throw new Error('offline');
	}
}

function newVault(): ProviderVault {
	const store = new Store<ProviderVaultStoreState>({ defaults });
	Object.defineProperty(store, 'path', { configurable: true, value: undefined });
	return new ProviderVault(
		store,
		storage,
		'darwin'
	);
}

it('recovers on a second device, retains dirty data offline, and converges tombstones', async () => {
	const cloud = new FakeCloud();
	const firstAuth = new FakeAuth();
	const secondAuth = new FakeAuth();
	const firstVault = newVault();
	const secondVault = newVault();
	const first = new ProviderSyncService(firstAuth, firstVault, cloud);
	const second = new ProviderSyncService(secondAuth, secondVault, cloud);

	firstVault.save('models', {
		id: 'openai',
		name: 'OpenAI',
		apiKey: 'first-key',
		baseUrl: 'https://api.openai.com/v1',
	});
	await first.setup('correct horse battery staple');
	await expect(second.unlock('wrong passphrase value')).rejects.toThrow('incorrect');
	await second.unlock('correct horse battery staple');
	expect(secondVault.get('models', 'openai')?.apiKey).toBe('first-key');

	firstVault.save('models', {
		id: 'openai',
		name: 'OpenAI',
		apiKey: 'rotated-key',
		baseUrl: 'https://api.openai.com/v1',
	});
	cloud.fail = true;
	await expect(first.sync()).rejects.toThrow('offline');
	expect(firstVault.get('models', 'openai')?.apiKey).toBe('rotated-key');
	expect(firstVault.records().find((record) => record.providerId === 'openai')?.dirty).toBe(true);

	cloud.fail = false;
	await first.sync();
	await second.sync();
	expect(secondVault.get('models', 'openai')?.apiKey).toBe('rotated-key');

	secondVault.remove('models', 'openai');
	await second.sync();
	await first.sync();
	expect(firstVault.get('models', 'openai')).toBeUndefined();
	expect(secondVault.get('models', 'openai')).toBeUndefined();
	expect(cloud.records.get('models:openai')?.tombstoneAt).toEqual(expect.any(String));

	firstAuth.state = { status: 'signedOut', persistence: 'encrypted' };
	expect(firstVault.records()).toHaveLength(1);
});
