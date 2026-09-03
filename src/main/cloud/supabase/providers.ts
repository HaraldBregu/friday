import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProviderCredentialKind } from '../../../shared/provider_types';
import type {
	ProviderCloudPort,
	ProviderVaultCloudRecord,
} from '../../providers/remote';
import type {
	ProviderKeyEnvelope,
	ProviderVaultRecord,
} from '../../providers/providers_types';
import { publicCloudError } from '../cloud_error';

interface VaultRow {
	vault_id: string;
	wrapped_data_key: string;
	wrapping_nonce: string;
	wrapping_tag: string;
	kdf_salt: string;
	kdf_n: number;
	kdf_r: number;
	kdf_p: number;
	key_version: number;
}

interface CredentialRow {
	kind: string;
	provider_id: string;
	ciphertext: string;
	nonce: string;
	tag: string;
	key_version: number;
	client_modified_at: string;
	writer_device_id: string;
	server_revision: number | string;
	tombstoned_at: string | null;
	server_modified_at: string;
}

const VAULT_FIELDS =
	'vault_id,wrapped_data_key,wrapping_nonce,wrapping_tag,kdf_salt,kdf_n,kdf_r,kdf_p,key_version';
const CREDENTIAL_FIELDS =
	'kind,provider_id,ciphertext,nonce,tag,key_version,client_modified_at,writer_device_id,server_revision,tombstoned_at,server_modified_at';

export class SupabaseProviderCloud implements ProviderCloudPort {
	constructor(private readonly client: SupabaseClient) {}

	async getVault(): Promise<ProviderVaultCloudRecord | undefined> {
		const { data, error } = await this.client
			.from('provider_vaults')
			.select(VAULT_FIELDS)
			.maybeSingle();
		if (error) throw publicCloudError(error);
		return data ? this.vault(data as VaultRow) : undefined;
	}

	async createVault(vaultId: string, envelope: ProviderKeyEnvelope): Promise<void> {
		const { error } = await this.client.from('provider_vaults').insert({
			vault_id: vaultId,
			...this.envelope(envelope),
		});
		if (error) throw publicCloudError(error);
	}

	async updateVault(vaultId: string, envelope: ProviderKeyEnvelope): Promise<void> {
		const { key_version: _keyVersion, ...rewrappedKey } = this.envelope(envelope);
		const { error } = await this.client
			.from('provider_vaults')
			.update(rewrappedKey)
			.eq('vault_id', vaultId);
		if (error) throw publicCloudError(error);
	}

	async listCredentials(vaultId: string): Promise<ProviderVaultRecord[]> {
		const { data, error } = await this.client
			.from('provider_credentials')
			.select(CREDENTIAL_FIELDS);
		if (error) throw publicCloudError(error);
		return (data as CredentialRow[]).map((row) => this.credential(row, vaultId));
	}

	async syncCredential(record: ProviderVaultRecord): Promise<ProviderVaultRecord> {
		const { data, error } = await this.client
			.rpc('sync_provider_credential', {
				p_kind: this.cloudKind(record.kind),
				p_provider_id: record.providerId,
				p_ciphertext: record.ciphertext,
				p_nonce: record.nonce,
				p_tag: record.tag,
				p_key_version: record.keyVersion,
				p_client_modified_at: record.clientModifiedAt,
				p_writer_device_id: record.writerDeviceId,
				p_tombstoned_at: record.tombstoneAt ?? null,
			})
			.single();
		if (error) throw publicCloudError(error);
		return this.credential(data as CredentialRow, record.vaultId);
	}

	private envelope(envelope: ProviderKeyEnvelope): Record<string, string | number> {
		return {
			wrapped_data_key: envelope.wrappedDataKey,
			wrapping_nonce: envelope.wrappingNonce,
			wrapping_tag: envelope.wrappingTag,
			kdf_salt: envelope.kdfSalt,
			kdf_n: envelope.kdfN,
			kdf_r: envelope.kdfR,
			kdf_p: envelope.kdfP,
			key_version: envelope.keyVersion,
		};
	}

	private vault(row: VaultRow): ProviderVaultCloudRecord {
		return {
			vaultId: row.vault_id,
			wrappedDataKey: row.wrapped_data_key,
			wrappingNonce: row.wrapping_nonce,
			wrappingTag: row.wrapping_tag,
			kdfSalt: row.kdf_salt,
			kdfN: row.kdf_n,
			kdfR: row.kdf_r,
			kdfP: row.kdf_p,
			keyVersion: row.key_version,
		};
	}

	private credential(row: CredentialRow, vaultId: string): ProviderVaultRecord {
		const revision = Number(row.server_revision);
		if (!Number.isSafeInteger(revision) || revision < 1) {
			throw new Error('Cloud provider credential is invalid.');
		}
		return {
			vaultId,
			kind: this.localKind(row.kind),
			providerId: row.provider_id,
			schemaVersion: 1,
			keyVersion: row.key_version,
			ciphertext: row.ciphertext,
			nonce: row.nonce,
			tag: row.tag,
			clientModifiedAt: row.client_modified_at,
			writerDeviceId: row.writer_device_id,
			dirty: false,
			...(row.tombstoned_at ? { tombstoneAt: row.tombstoned_at } : {}),
			serverRevision: revision,
			serverModifiedAt: row.server_modified_at,
		};
	}

	private cloudKind(kind: ProviderCredentialKind): 'models' | 'databases' | 'search' {
		return kind === 'search_engines' ? 'search' : kind;
	}

	private localKind(kind: string): ProviderCredentialKind {
		if (kind === 'models' || kind === 'databases') return kind;
		if (kind === 'search') return 'search_engines';
		throw new Error('Cloud provider credential is invalid.');
	}
}
