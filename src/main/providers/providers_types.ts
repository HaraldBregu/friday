import type { ProviderCredentialKind, StoredProvider } from '../../shared/provider_types';

export interface ProviderMetadata {
	id: string;
}

export type ProvidersStoreState = Record<ProviderCredentialKind, unknown[]>;

export interface VaultSafeStorage {
	isEncryptionAvailable(): boolean;
	getSelectedStorageBackend(): string;
	encryptString(value: string): Buffer;
	decryptString(value: Buffer): string;
}

export interface ProviderVaultRecord {
	vaultId: string;
	kind: ProviderCredentialKind;
	providerId: string;
	schemaVersion: number;
	keyVersion: number;
	ciphertext: string;
	nonce: string;
	tag: string;
	clientModifiedAt: string;
	writerDeviceId: string;
	dirty: boolean;
	tombstoneAt?: string;
	serverRevision?: number;
	serverModifiedAt?: string;
}

export interface ProviderVaultStoreState extends Record<string, unknown> {
	schemaVersion: number;
	vaultId: string;
	deviceId: string;
	protectedKey?: string;
	records: Record<string, ProviderVaultRecord>;
}

export interface ProviderCredentialState {
	provider: StoredProvider;
	kind: ProviderCredentialKind;
	dirty: boolean;
	persistence: 'encrypted' | 'memory';
}

export interface ProviderKeyEnvelope {
	wrappedDataKey: string;
	wrappingNonce: string;
	wrappingTag: string;
	kdfSalt: string;
	kdfN: number;
	kdfR: number;
	kdfP: number;
	keyVersion: number;
}
