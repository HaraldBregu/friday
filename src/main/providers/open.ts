import { createDecipheriv } from 'node:crypto';
import type { StoredProvider } from '../../shared/provider_types';
import { providerCredentialAad } from './aad';
import type { ProviderVaultRecord } from './providers_types';

export function openProviderCredential(record: ProviderVaultRecord, key: Buffer): StoredProvider {
	if (key.byteLength !== 32) throw new Error('Provider vault key is invalid.');
	const nonce = Buffer.from(record.nonce, 'base64');
	const tag = Buffer.from(record.tag, 'base64');
	if (nonce.byteLength !== 12 || tag.byteLength !== 16) {
		throw new Error('Provider vault record is invalid.');
	}
	const decipher = createDecipheriv('aes-256-gcm', key, nonce);
	decipher.setAAD(
		providerCredentialAad(record.vaultId, record.kind, record.providerId, record.schemaVersion)
	);
	decipher.setAuthTag(tag);
	const plaintext = Buffer.concat([
		decipher.update(Buffer.from(record.ciphertext, 'base64')),
		decipher.final(),
	]);
	const value = JSON.parse(plaintext.toString('utf8')) as Partial<StoredProvider>;
	if (
		typeof value.name !== 'string' ||
		typeof value.apiKey !== 'string' ||
		typeof value.baseUrl !== 'string'
	) {
		throw new Error('Provider vault payload is invalid.');
	}
	return { id: record.providerId, name: value.name, apiKey: value.apiKey, baseUrl: value.baseUrl };
}
