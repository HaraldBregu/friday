import type { AuthState } from '../../shared/auth_types';
import type {
	ProviderCredentialKind,
	ProviderCredentialSummary,
	ProviderVaultStatus,
} from '../../shared/provider_types';
import { reconcileProviderMetadata } from './providers_store';
import type { ProviderCloudPort, ProviderVaultCloudRecord } from './remote';
import type { ProviderVaultRecord } from './providers_types';
import { unwrapProviderDataKey } from './unwrap';
import { ProviderVault, providerVault } from './vault';
import { wrapProviderDataKey } from './wrap';

interface ProviderAuthPort {
	getState(): AuthState;
	onStateChanged(listener: (state: AuthState) => void): () => void;
}

export class ProviderSyncService {
	private cloudConfigured = false;
	private unlocked = false;
	private lastSyncedAt?: string;
	private initialized = false;
	private retryAttempt = 0;
	private retryTimer?: ReturnType<typeof setTimeout>;
	private syncPromise?: Promise<void>;
	private syncRequested = false;
	private unsubscribeAuth?: () => void;
	private unsubscribeVault?: () => void;

	constructor(
		private readonly auth: ProviderAuthPort,
		private readonly vault: ProviderVault = providerVault,
		private readonly cloud?: ProviderCloudPort
	) {}

	initialize(): void {
		if (this.initialized) return;
		this.initialized = true;
		this.unsubscribeAuth = this.auth.onStateChanged((state) => {
			if (state.status === 'signedIn') {
				this.requestRefresh();
				return;
			}
			this.resetReadiness();
		});
		this.unsubscribeVault = this.vault.onChanged(() => this.requestSync());
		const state = this.auth.getState();
		if (state.status === 'signedIn') this.requestRefresh();
	}

	status(): ProviderVaultStatus {
		const pending = this.vault.records().filter((record) => record.dirty).length;
		return {
			persistence: this.vault.persistence,
			cloudConfigured: this.cloudConfigured,
			unlocked: this.unlocked,
			pending,
			...(this.lastSyncedAt ? { lastSyncedAt: this.lastSyncedAt } : {}),
			...(this.vault.persistence === 'memory'
				? {
						warning:
							'Secure operating-system storage is unavailable. Provider keys are kept in memory only.',
					}
				: {}),
		};
	}

	listSummaries(kind?: ProviderCredentialKind): ProviderCredentialSummary[] {
		return this.vault.states(kind).map((state) => ({
			kind: state.kind,
			id: state.provider.id,
			name: state.provider.name,
			baseUrl: state.provider.baseUrl,
			configured: Boolean(state.provider.apiKey.trim()),
			syncStatus:
				state.persistence === 'memory'
					? 'memoryOnly'
					: state.dirty
						? this.cloudConfigured
							? 'pending'
							: 'local'
						: 'synced',
		}));
	}

	getSummary(kind: ProviderCredentialKind, id: string): ProviderCredentialSummary | undefined {
		return this.listSummaries(kind).find((summary) => summary.id === id);
	}

	async setup(passphrase: string): Promise<ProviderVaultStatus> {
		this.requireSignedIn();
		this.requirePassphrase(passphrase);
		if (await this.cloudPort().getVault()) throw new Error('A provider sync vault already exists.');
		const identity = this.vault.ensureIdentity();
		try {
			const envelope = await wrapProviderDataKey(identity.key, passphrase, identity.vaultId);
			await this.cloudPort().createVault(identity.vaultId, envelope);
			this.cloudConfigured = true;
			this.unlocked = true;
			await this.sync();
			return this.status();
		} finally {
			identity.key.fill(0);
		}
	}

	async unlock(passphrase: string): Promise<ProviderVaultStatus> {
		this.requireSignedIn();
		this.requirePassphrase(passphrase);
		const remote = await this.cloudPort().getVault();
		if (!remote) throw new Error('Set up provider sync before unlocking it.');
		let key: Buffer | undefined;
		try {
			key = await unwrapProviderDataKey(remote, passphrase, remote.vaultId);
			this.vault.adopt(remote.vaultId, key);
		} catch {
			throw new Error('The provider sync passphrase is incorrect.');
		} finally {
			key?.fill(0);
		}
		this.cloudConfigured = true;
		this.unlocked = true;
		await this.sync();
		return this.status();
	}

	async changePassphrase(passphrase: string): Promise<ProviderVaultStatus> {
		this.requireSignedIn();
		this.requirePassphrase(passphrase);
		const remote = await this.requireUnlockedVault();
		const identity = this.vault.identity();
		if (!identity || identity.vaultId !== remote.vaultId)
			throw new Error('Provider vault is locked.');
		try {
			const envelope = await wrapProviderDataKey(identity.key, passphrase, identity.vaultId);
			await this.cloudPort().updateVault(identity.vaultId, envelope);
			return this.status();
		} finally {
			identity.key.fill(0);
		}
	}

	async sync(): Promise<ProviderVaultStatus> {
		this.syncRequested = true;
		if (!this.syncPromise) {
			const task = this.drainSync();
			this.syncPromise = task;
			void task.then(
				() => this.finishSync(task),
				() => this.finishSync(task)
			);
		}
		let task: Promise<void> | undefined;
		do {
			task = this.syncPromise;
			if (task) await task;
		} while (this.syncPromise && this.syncPromise !== task);
		return this.status();
	}

	requestSync(): void {
		if (!this.initialized || !this.isSignedIn() || !this.cloudConfigured || !this.unlocked) return;
		void this.sync().catch(() => this.scheduleRetry());
	}

	destroy(): void {
		this.unsubscribeAuth?.();
		this.unsubscribeVault?.();
		this.resetReadiness();
		this.initialized = false;
	}

	private requestRefresh(): void {
		void this.refresh().catch(() => this.scheduleRetry());
	}

	private async refresh(): Promise<void> {
		this.requireSignedIn();
		const remote = await this.cloudPort().getVault();
		this.requireSignedIn();
		this.cloudConfigured = Boolean(remote);
		const identity = this.vault.identity();
		this.unlocked = Boolean(remote && identity && remote.vaultId === identity.vaultId);
		if (this.unlocked) await this.sync();
	}

	private async drainSync(): Promise<void> {
		do {
			this.syncRequested = false;
			await this.performSync();
		} while (this.syncRequested || this.vault.records().some((record) => record.dirty));
	}

	private async performSync(): Promise<void> {
		this.requireSignedIn();
		const remoteVault = await this.requireUnlockedVault();
		const identity = this.vault.identity();
		if (!identity || identity.vaultId !== remoteVault.vaultId) {
			this.unlocked = false;
			throw new Error('Provider vault is locked.');
		}
		identity.key.fill(0);
		const remoteRecords = await this.cloudPort().listCredentials(remoteVault.vaultId);
		this.requireSignedIn();
		for (const remote of remoteRecords) {
			const local = this.localRecord(remote);
			if (!local || this.compare(remote, local) > 0) this.vault.putRemote(remote);
		}
		const dirty = this.vault.records().filter((record) => record.dirty);
		const canonical = await Promise.all(
			dirty.map((record) => this.cloudPort().syncCredential(record))
		);
		this.requireSignedIn();
		for (const record of canonical) {
			const local = this.localRecord(record);
			if (!local || this.compare(record, local) >= 0) this.vault.putRemote(record);
		}
		reconcileProviderMetadata();
		this.retryAttempt = 0;
		this.lastSyncedAt = new Date().toISOString();
	}

	private async requireUnlockedVault(): Promise<ProviderVaultCloudRecord> {
		this.requireSignedIn();
		const remote = await this.cloudPort().getVault();
		this.requireSignedIn();
		if (!remote) {
			this.cloudConfigured = false;
			this.unlocked = false;
			throw new Error('Set up provider sync before synchronizing.');
		}
		this.cloudConfigured = true;
		return remote;
	}

	private requireSignedIn(): void {
		if (!this.isSignedIn()) throw new Error('Sign in to synchronize provider credentials.');
	}

	private isSignedIn(): boolean {
		return this.auth.getState().status === 'signedIn';
	}

	private requirePassphrase(passphrase: string): void {
		if (typeof passphrase !== 'string' || passphrase.length < 12 || passphrase.length > 1024) {
			throw new Error('The provider sync passphrase must contain 12 to 1024 characters.');
		}
	}

	private recordKey(record: Pick<ProviderVaultRecord, 'kind' | 'providerId'>): string {
		return `${record.kind}:${record.providerId}`;
	}

	private localRecord(
		record: Pick<ProviderVaultRecord, 'kind' | 'providerId'>
	): ProviderVaultRecord | undefined {
		const key = this.recordKey(record);
		return this.vault.records().find((candidate) => this.recordKey(candidate) === key);
	}

	private compare(left: ProviderVaultRecord, right: ProviderVaultRecord): number {
		const time = Date.parse(left.clientModifiedAt) - Date.parse(right.clientModifiedAt);
		if (time !== 0) return time;
		return left.writerDeviceId.localeCompare(right.writerDeviceId);
	}

	private scheduleRetry(): void {
		if (this.retryTimer || !this.isSignedIn()) return;
		const delay = Math.min(30_000, 1000 * 2 ** this.retryAttempt);
		this.retryAttempt = Math.min(this.retryAttempt + 1, 5);
		this.retryTimer = setTimeout(() => {
			this.retryTimer = undefined;
			this.requestRefresh();
		}, delay);
	}

	private finishSync(task: Promise<void>): void {
		if (this.syncPromise !== task) return;
		this.syncPromise = undefined;
		if (this.syncRequested) this.requestSync();
	}

	private resetReadiness(): void {
		this.cloudConfigured = false;
		this.unlocked = false;
		this.retryAttempt = 0;
		this.syncRequested = false;
		if (this.retryTimer) clearTimeout(this.retryTimer);
		this.retryTimer = undefined;
	}

	private cloudPort(): ProviderCloudPort {
		if (!this.cloud) throw new Error('Cloud credential sync is unavailable.');
		return this.cloud;
	}
}
