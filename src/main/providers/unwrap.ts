import { createDecipheriv } from 'node:crypto';
import { deriveProviderWrappingKey } from './derive';
import type { ProviderKeyEnvelope } from './providers_types';
import { providerWrappingAad } from './wrapaad';

export async function unwrapProviderDataKey(
	envelope: ProviderKeyEnvelope,
	passphrase: string,
	vaultId: string
): Promise<Buffer> {
	if (
		envelope.kdfN !== 131072 ||
		envelope.kdfR !== 8 ||
		envelope.kdfP !== 1 ||
		envelope.keyVersion !== 1
	) {
		throw new Error('Provider vault parameters are invalid.');
	}
	const salt = Buffer.from(envelope.kdfSalt, 'base64');
	const nonce = Buffer.from(envelope.wrappingNonce, 'base64');
	const tag = Buffer.from(envelope.wrappingTag, 'base64');
	const wrapped = Buffer.from(envelope.wrappedDataKey, 'base64');
	if (
		salt.byteLength !== 16 ||
		nonce.byteLength !== 12 ||
		tag.byteLength !== 16 ||
		wrapped.byteLength !== 32
	) {
		throw new Error('Provider vault parameters are invalid.');
	}
	const parameters = { N: envelope.kdfN, r: envelope.kdfR, p: envelope.kdfP };
	const wrappingKey = await deriveProviderWrappingKey(passphrase, salt, parameters);
	try {
		const decipher = createDecipheriv('aes-256-gcm', wrappingKey, nonce);
		decipher.setAAD(providerWrappingAad(vaultId, envelope.keyVersion, parameters, envelope.kdfSalt));
		decipher.setAuthTag(tag);
		const key = Buffer.concat([decipher.update(wrapped), decipher.final()]);
		if (key.byteLength !== 32) throw new Error('Provider vault key is invalid.');
		return key;
	} finally {
		wrappingKey.fill(0);
	}
}
