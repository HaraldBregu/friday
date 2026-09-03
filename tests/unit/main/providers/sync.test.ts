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

jest.mock('../../../../src/main/providers/providers_store', () => ({
	reconcileProviderMetadata: jest.fn(),
}));

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

	setState(state: AuthState): void {
		this.state = state;
		this.listeners.forEach((listener) => listener(structuredClone(state)));
	}

	getClient(): never {
		throw new Error('unused');
	}
}

class FakeCloud implements ProviderCloudPort {
	vault?: ProviderVaultCloudRecord;
	records = new Map<string, ProviderVaultRecord>();
	fail = false;
	getVaultCalls = 0;
	syncCredentialCalls = 0;
	beforeListCredentials?: () => void;
	beforeSyncCredential?: (record: ProviderVaultRecord) => void;

	async getVault(): Promise<ProviderVaultCloudRecord | undefined> {
		this.getVaultCalls += 1;
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
		this.beforeListCredentials?.();
		return structuredClone([...this.records.values()]);
	}

	async syncCredential(record: ProviderVaultRecord): Promise<ProviderVaultRecord> {
		this.check();
		this.syncCredentialCalls += 1;
		this.beforeSyncCredential?.(structuredClone(record));
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

it('keeps signed-out writes local and synchronizes them after sign-in', async () => {
	const cloud = new FakeCloud();
	const auth = new FakeAuth();
	const vault = newVault();
	const sync = new ProviderSyncService(auth, vault, cloud);
	await sync.setup('correct horse battery staple');
	auth.setState({ status: 'signedOut', persistence: 'encrypted' });
	sync.initialize();

	vault.save('models', {
		id: 'anthropic',
		name: 'Anthropic',
		apiKey: 'signed-out-key',
		baseUrl: 'https://api.anthropic.com',
	});
	expect(vault.get('models', 'anthropic')?.apiKey).toBe('signed-out-key');
	expect(cloud.records.has('models:anthropic')).toBe(false);

	auth.setState({
		status: 'signedIn',
		persistence: 'encrypted',
		user: { id: '11111111-1111-4111-8111-111111111111', email: 'owner@example.test' },
	});
	for (let attempt = 0; attempt < 20 && !cloud.records.has('models:anthropic'); attempt += 1) {
		await new Promise<void>((resolve) => setImmediate(resolve));
	}

	expect(cloud.records.get('models:anthropic')).toBeDefined();
	sync.destroy();
});

it('does not authorize credential sync during recovery and clears readiness on sign-out', async () => {
	jest.useFakeTimers();
	const cloud = new FakeCloud();
	const auth = new FakeAuth();
	const vault = newVault();
	const sync = new ProviderSyncService(auth, vault, cloud);
	auth.state = { status: 'recovery', persistence: 'encrypted' };
	sync.initialize();

	await Promise.resolve();
	expect(cloud.getVaultCalls).toBe(0);
	await expect(sync.sync()).rejects.toThrow('Sign in to synchronize provider credentials');

	auth.setState({
		status: 'signedIn',
		persistence: 'encrypted',
		user: { id: '11111111-1111-4111-8111-111111111111', email: 'owner@example.test' },
	});
	cloud.fail = true;
	auth.setState(auth.state);
	for (let attempt = 0; attempt < 5; attempt += 1) await Promise.resolve();
	expect(jest.getTimerCount()).toBe(1);

	auth.setState({ status: 'signedOut', persistence: 'encrypted' });
	expect(sync.status()).toMatchObject({ cloudConfigured: false, unlocked: false });
	expect(jest.getTimerCount()).toBe(0);
	sync.destroy();
	jest.useRealTimers();
});

it('does not overwrite a local edit made while remote credentials are being listed', async () => {
	jest.useFakeTimers().setSystemTime(new Date('2026-09-03T10:00:00.000Z'));
	const cloud = new FakeCloud();
	const auth = new FakeAuth();
	const vault = newVault();
	const sync = new ProviderSyncService(auth, vault, cloud);
	vault.save('models', {
		id: 'openai',
		name: 'OpenAI',
		apiKey: 'initial-key',
		baseUrl: 'https://api.openai.com/v1',
	});
	await sync.setup('correct horse battery staple');
	const initial = vault.records()[0];

	jest.setSystemTime(new Date('2026-09-03T10:00:01.000Z'));
	vault.save('models', {
		id: 'openai',
		name: 'OpenAI',
		apiKey: 'remote-key',
		baseUrl: 'https://api.openai.com/v1',
	});
	await sync.sync();
	vault.putRemote(initial);

	jest.setSystemTime(new Date('2026-09-03T10:00:02.000Z'));
	cloud.beforeListCredentials = () => {
		cloud.beforeListCredentials = undefined;
		vault.save('models', {
			id: 'openai',
			name: 'OpenAI',
			apiKey: 'local-key',
			baseUrl: 'https://api.openai.com/v1',
		});
	};
	await sync.sync();

	expect(vault.get('models', 'openai')?.apiKey).toBe('local-key');
	expect(vault.records()[0].dirty).toBe(false);
	jest.useRealTimers();
});

it('preserves edits made during upload and drains them in a follow-up pass', async () => {
	jest.useFakeTimers().setSystemTime(new Date('2026-09-03T11:00:00.000Z'));
	const cloud = new FakeCloud();
	const auth = new FakeAuth();
	const vault = newVault();
	const sync = new ProviderSyncService(auth, vault, cloud);
	vault.save('models', {
		id: 'anthropic',
		name: 'Anthropic',
		apiKey: 'initial-key',
		baseUrl: 'https://api.anthropic.com',
	});
	await sync.setup('correct horse battery staple');
	const callsBeforeEdit = cloud.syncCredentialCalls;

	jest.setSystemTime(new Date('2026-09-03T11:00:01.000Z'));
	vault.save('models', {
		id: 'anthropic',
		name: 'Anthropic',
		apiKey: 'first-edit',
		baseUrl: 'https://api.anthropic.com',
	});
	cloud.beforeSyncCredential = () => {
		cloud.beforeSyncCredential = undefined;
		jest.setSystemTime(new Date('2026-09-03T11:00:02.000Z'));
		vault.save('models', {
			id: 'anthropic',
			name: 'Anthropic',
			apiKey: 'second-edit',
			baseUrl: 'https://api.anthropic.com',
		});
	};
	await sync.sync();

	expect(cloud.syncCredentialCalls - callsBeforeEdit).toBe(2);
	expect(vault.get('models', 'anthropic')?.apiKey).toBe('second-edit');
	expect(vault.records()[0].dirty).toBe(false);
	jest.useRealTimers();
});
