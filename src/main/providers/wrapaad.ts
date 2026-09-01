export function providerWrappingAad(
	vaultId: string,
	keyVersion: number,
	parameters: { N: number; r: number; p: number },
	salt: string
): Buffer {
	return Buffer.from(
		JSON.stringify([vaultId, keyVersion, parameters.N, parameters.r, parameters.p, salt]),
		'utf8'
	);
}
