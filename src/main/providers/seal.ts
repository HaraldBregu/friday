import { createCipheriv, randomBytes } from 'node:crypto';
import type { StoredProvider } from '../../shared/provider_types';
import { providerCredentialAad } from './aad';
import type { ProviderVaultRecord } from './providers_types';

export function sealProviderCredential(
	provider: StoredProvider,
	key: Buffer,
	record: Pick<
		ProviderVaultRecord,
		| 'vaultId'
		| 'kind'
		| 'providerId'
		| 'schemaVersion'
		| 'keyVersion'
		| 'clientModifiedAt'
		| 'writerDeviceId'
	>
): ProviderVaultRecord {
	if (key.byteLength !== 32) throw new Error('Provider vault key is invalid.');
	const nonce = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key, nonce);
	cipher.setAAD(
		providerCredentialAad(record.vaultId, record.kind, record.providerId, record.schemaVersion)
	);
	const ciphertext = Buffer.concat([
		cipher.update(
			JSON.stringify({ name: provider.name, apiKey: provider.apiKey, baseUrl: provider.baseUrl }),
			'utf8'
		),
		cipher.final(),
	]);
	return {
		...record,
		ciphertext: ciphertext.toString('base64'),
		nonce: nonce.toString('base64'),
		tag: cipher.getAuthTag().toString('base64'),
		dirty: true,
	};
}
