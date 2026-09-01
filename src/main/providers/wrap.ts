import { createCipheriv, randomBytes } from 'node:crypto';
import { deriveProviderWrappingKey } from './derive';
import type { ProviderKeyEnvelope } from './providers_types';
import { providerWrappingAad } from './wrapaad';

const KDF = { N: 131072, r: 8, p: 1 } as const;

export async function wrapProviderDataKey(
	dataKey: Buffer,
	passphrase: string,
	vaultId: string
): Promise<ProviderKeyEnvelope> {
	if (dataKey.byteLength !== 32) throw new Error('Provider vault key is invalid.');
	const salt = randomBytes(16);
	const saltBase64 = salt.toString('base64');
	const wrappingKey = await deriveProviderWrappingKey(passphrase, salt, KDF);
	const nonce = randomBytes(12);
	try {
		const cipher = createCipheriv('aes-256-gcm', wrappingKey, nonce);
		cipher.setAAD(providerWrappingAad(vaultId, 1, KDF, saltBase64));
		const wrapped = Buffer.concat([cipher.update(dataKey), cipher.final()]);
		return {
			wrappedDataKey: wrapped.toString('base64'),
			wrappingNonce: nonce.toString('base64'),
			wrappingTag: cipher.getAuthTag().toString('base64'),
			kdfSalt: saltBase64,
			kdfN: KDF.N,
			kdfR: KDF.r,
			kdfP: KDF.p,
			keyVersion: 1,
		};
	} finally {
		wrappingKey.fill(0);
	}
}
