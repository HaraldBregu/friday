import { scrypt } from 'node:crypto';

export function deriveProviderWrappingKey(
	passphrase: string,
	salt: Buffer,
	parameters: { N: number; r: number; p: number }
): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scrypt(
			passphrase,
			salt,
			32,
			{ ...parameters, maxmem: 256 * 1024 * 1024 },
			(error, derivedKey) => (error ? reject(error) : resolve(Buffer.from(derivedKey)))
		);
	});
}
