import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { safeStorage } from 'electron';
import Store from 'electron-store';
import type { ProviderCredentialKind, StoredProvider } from '../../shared/provider_types';
import { userDataLocation } from '../shared/user_data_location';
import { isProviderSafeStorageAvailable } from './available';
import { openProviderCredential } from './open';
import type {
	ProviderCredentialState,
	ProviderVaultRecord,
	ProviderVaultStoreState,
	VaultSafeStorage,
} from './providers_types';
import { restrictProviderPermissions } from './restrict';
import { sealProviderCredential } from './seal';

const SCHEMA_VERSION = 1;
const KEY_VERSION = 1;
const EMPTY_PROVIDER = { name: '', apiKey: '', baseUrl: '' };

const defaults: ProviderVaultStoreState = {
	schemaVersion: SCHEMA_VERSION,
	vaultId: '',
	deviceId: '',
	records: {},
};

export class ProviderVault {
	private key?: Buffer;
	private readonly memory = new Map<string, StoredProvider>();
	private readonly listeners = new Set<() => void>();

	constructor(
		private readonly store: Store<ProviderVaultStoreState>,
		private readonly storage: VaultSafeStorage = safeStorage,
		private readonly platform: NodeJS.Platform = process.platform
	) {}

	get path(): string {
		return this.store.path;
	}

	get persistence(): 'encrypted' | 'memory' {
		return this.available() ? 'encrypted' : 'memory';
	}

	onChanged(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	get(kind: ProviderCredentialKind, id: string): StoredProvider | undefined {
		const memory = this.memory.get(this.recordKey(kind, id));
		if (memory) return structuredClone(memory);
		const record = this.state().records[this.recordKey(kind, id)];
		if (!record || record.tombstoneAt) return undefined;
		const key = this.readKey();
		if (!key) return undefined;
		try {
			return openProviderCredential(record, key);
		} catch {
			return undefined;
		}
	}

	list(kind: ProviderCredentialKind): StoredProvider[] {
		const providers = new Map<string, StoredProvider>();
		const key = this.readKey();
		if (key) {
			for (const record of Object.values(this.state().records)) {
				if (record.kind !== kind || record.tombstoneAt) continue;
				try {
					providers.set(record.providerId, openProviderCredential(record, key));
				} catch {
					continue;
				}
			}
		}
		for (const [recordKey, provider] of this.memory) {
			if (recordKey.startsWith(`${kind}:`)) providers.set(provider.id, structuredClone(provider));
		}
		return [...providers.values()];
	}

	states(kind?: ProviderCredentialKind): ProviderCredentialState[] {
		const result: ProviderCredentialState[] = [];
		const key = this.readKey();
		if (key) {
			for (const record of Object.values(this.state().records)) {
				if ((kind && record.kind !== kind) || record.tombstoneAt) continue;
				try {
					result.push({
						provider: openProviderCredential(record, key),
						kind: record.kind,
						dirty: record.dirty,
						persistence: 'encrypted',
					});
				} catch {
					continue;
				}
			}
		}
		for (const [recordKey, provider] of this.memory) {
			const memoryKind = recordKey.slice(0, recordKey.indexOf(':')) as ProviderCredentialKind;
			if (kind && memoryKind !== kind) continue;
			result.push({
				provider: structuredClone(provider),
				kind: memoryKind,
				dirty: true,
				persistence: 'memory',
			});
		}
		return result;
	}

	save(kind: ProviderCredentialKind, provider: StoredProvider): void {
		if (!this.available()) {
			this.memory.set(this.recordKey(kind, provider.id), structuredClone(provider));
			this.emit();
			return;
		}
		const { state, key } = this.writableState();
		const recordKey = this.recordKey(kind, provider.id);
		const previous = state.records[recordKey];
		state.records[recordKey] = sealProviderCredential(provider, key, {
			vaultId: state.vaultId,
			kind,
			providerId: provider.id,
			schemaVersion: SCHEMA_VERSION,
			keyVersion: KEY_VERSION,
			clientModifiedAt: this.nextModifiedAt(previous?.clientModifiedAt),
			writerDeviceId: state.deviceId,
		});
		this.persist(state);
		this.memory.delete(recordKey);
		this.emit();
	}

	remove(kind: ProviderCredentialKind, id: string): void {
		const recordKey = this.recordKey(kind, id);
		this.memory.delete(recordKey);
		if (!this.available()) {
			this.emit();
			return;
		}
		const { state, key } = this.writableState();
		const previous = state.records[recordKey];
		if (!previous) return;
		const tombstoneAt = this.nextModifiedAt(previous.clientModifiedAt);
		state.records[recordKey] = {
			...sealProviderCredential({ id, ...EMPTY_PROVIDER }, key, {
				vaultId: state.vaultId,
				kind,
				providerId: id,
				schemaVersion: SCHEMA_VERSION,
				keyVersion: KEY_VERSION,
				clientModifiedAt: tombstoneAt,
				writerDeviceId: state.deviceId,
			}),
			tombstoneAt,
		};
		this.persist(state);
		this.emit();
	}

	migrate(kind: ProviderCredentialKind, provider: StoredProvider): boolean {
		const existing = this.state().records[this.recordKey(kind, provider.id)];
		if (existing) {
			const key = this.readKey();
			if (!key) {
				this.memory.set(this.recordKey(kind, provider.id), structuredClone(provider));
				return false;
			}
			openProviderCredential(existing, key);
			return true;
		}
		if (!this.available()) {
			this.memory.set(this.recordKey(kind, provider.id), structuredClone(provider));
			return false;
		}
		this.save(kind, provider);
		const saved = this.state().records[this.recordKey(kind, provider.id)];
		const key = this.readKey();
		if (!saved || !key) return false;
		openProviderCredential(saved, key);
		return true;
	}

	hasPersistentRecord(kind: ProviderCredentialKind, id: string): boolean {
		return Boolean(this.state().records[this.recordKey(kind, id)]);
	}

	identity(): { vaultId: string; deviceId: string; key: Buffer } | undefined {
		const state = this.state();
		const key = this.readKey();
		if (!state.vaultId || !state.deviceId || !key) return undefined;
		return { vaultId: state.vaultId, deviceId: state.deviceId, key: Buffer.from(key) };
	}

	ensureIdentity(): { vaultId: string; deviceId: string; key: Buffer } {
		if (!this.available()) throw new Error('Secure operating-system storage is unavailable.');
		const { state, key } = this.writableState();
		this.persist(state);
		return { vaultId: state.vaultId, deviceId: state.deviceId, key: Buffer.from(key) };
	}

	records(): ProviderVaultRecord[] {
		return structuredClone(Object.values(this.state().records));
	}

	putRemote(record: ProviderVaultRecord): void {
		const state = this.state();
		const key = this.readKey();
		if (!key || record.vaultId !== state.vaultId) throw new Error('Provider vault is locked.');
		openProviderCredential(record, key);
		state.records[this.recordKey(record.kind, record.providerId)] = structuredClone(record);
		this.persist(state);
	}

	adopt(vaultId: string, key: Buffer): void {
		if (!this.available()) throw new Error('Secure operating-system storage is unavailable.');
		if (key.byteLength !== 32) throw new Error('Provider vault key is invalid.');
		const current = this.state();
		const currentKey = this.readKey();
		if (Object.keys(current.records).length > 0 && !currentKey) {
			throw new Error('The local provider vault cannot be opened.');
		}
		const next: ProviderVaultStoreState = {
			schemaVersion: SCHEMA_VERSION,
			vaultId,
			deviceId: current.deviceId || randomUUID(),
			protectedKey: this.storage.encryptString(key.toString('base64')).toString('base64'),
			records: {},
		};
		for (const record of Object.values(current.records)) {
			const provider = currentKey
				? openProviderCredential(record, currentKey)
				: { id: record.providerId, ...EMPTY_PROVIDER };
			next.records[this.recordKey(record.kind, record.providerId)] = {
				...sealProviderCredential(provider, key, {
					vaultId,
					kind: record.kind,
					providerId: record.providerId,
					schemaVersion: SCHEMA_VERSION,
					keyVersion: KEY_VERSION,
					clientModifiedAt: record.clientModifiedAt,
					writerDeviceId: record.writerDeviceId,
				}),
				...(record.tombstoneAt ? { tombstoneAt: record.tombstoneAt } : {}),
			};
		}
		for (const [recordKey, provider] of this.memory) {
			const kind = recordKey.slice(0, recordKey.indexOf(':')) as ProviderCredentialKind;
			next.records[recordKey] = sealProviderCredential(provider, key, {
				vaultId,
				kind,
				providerId: provider.id,
				schemaVersion: SCHEMA_VERSION,
				keyVersion: KEY_VERSION,
				clientModifiedAt: new Date().toISOString(),
				writerDeviceId: next.deviceId,
			});
		}
		this.persist(next);
		this.key = Buffer.from(key);
		this.memory.clear();
		this.emit();
	}

	private available(): boolean {
		return isProviderSafeStorageAvailable(this.storage, this.platform);
	}

	private state(): ProviderVaultStoreState {
		const stored = structuredClone(this.store.store);
		return {
			...defaults,
			...stored,
			records: stored.records && typeof stored.records === 'object' ? { ...stored.records } : {},
		};
	}

	private writableState(): { state: ProviderVaultStoreState; key: Buffer } {
		const state = this.state();
		state.vaultId ||= randomUUID();
		state.deviceId ||= randomUUID();
		let key = this.readKey();
		if (!key) {
			key = randomBytes(32);
			state.protectedKey = this.storage.encryptString(key.toString('base64')).toString('base64');
			this.key = Buffer.from(key);
		}
		return { state, key };
	}

	private readKey(): Buffer | undefined {
		if (this.key) return this.key;
		if (!this.available()) return undefined;
		const protectedKey = this.store.get('protectedKey');
		if (!protectedKey) return undefined;
		try {
			const key = Buffer.from(
				this.storage.decryptString(Buffer.from(protectedKey, 'base64')),
				'base64'
			);
			if (key.byteLength !== 32) return undefined;
			this.key = key;
			return key;
		} catch {
			return undefined;
		}
	}

	private persist(state: ProviderVaultStoreState): void {
		this.store.store = state;
		restrictProviderPermissions(path.dirname(this.store.path), this.store.path);
	}

	private recordKey(kind: ProviderCredentialKind, id: string): string {
		return `${kind}:${id}`;
	}

	private nextModifiedAt(previous?: string): string {
		const now = Date.now();
		const previousTime = previous ? Date.parse(previous) : 0;
		return new Date(Math.max(now, Number.isFinite(previousTime) ? previousTime + 1 : now)).toISOString();
	}

	private emit(): void {
		this.listeners.forEach((listener) => listener());
	}
}

const providerVaultStore = new Store<ProviderVaultStoreState>({
	name: 'provider-vault',
	cwd: path.resolve(userDataLocation(), 'settings'),
	accessPropertiesByDotNotation: false,
	defaults,
});

export const providerVault = new ProviderVault(providerVaultStore);
export const providerVaultPath = providerVaultStore.path;
