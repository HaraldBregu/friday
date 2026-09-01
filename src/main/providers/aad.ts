import type { ProviderCredentialKind } from '../../shared/provider_types';

export function providerCredentialAad(
	vaultId: string,
	kind: ProviderCredentialKind,
	providerId: string,
	schemaVersion: number
): Buffer {
	return Buffer.from(JSON.stringify([vaultId, kind, providerId, schemaVersion]), 'utf8');
}
