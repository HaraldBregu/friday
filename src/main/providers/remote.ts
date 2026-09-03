import type { ProviderKeyEnvelope, ProviderVaultRecord } from './providers_types';

export interface ProviderVaultCloudRecord extends ProviderKeyEnvelope {
	vaultId: string;
}

export interface ProviderCloudPort {
	getVault(): Promise<ProviderVaultCloudRecord | undefined>;
	createVault(vaultId: string, envelope: ProviderKeyEnvelope): Promise<void>;
	updateVault(vaultId: string, envelope: ProviderKeyEnvelope): Promise<void>;
	listCredentials(vaultId: string): Promise<ProviderVaultRecord[]>;
	syncCredential(record: ProviderVaultRecord): Promise<ProviderVaultRecord>;
}
