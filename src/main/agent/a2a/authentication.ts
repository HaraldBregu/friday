import type { A2aAgent, A2aAgentInput } from '../../../shared/a2a_types';

export function resolveA2aAuthentication(
	input: A2aAgentInput,
	existing: A2aAgent | undefined,
	url: string
): Pick<A2aAgent, 'authType' | 'credential' | 'apiKeyHeader'> {
	const suppliedCredential = input.credential?.trim() || input.token?.trim();
	const authType =
		input.authType ??
		(input.token !== undefined
			? suppliedCredential || (existing?.url === url && existing.credential)
				? 'bearer'
				: 'none'
			: suppliedCredential
				? 'bearer'
				: (existing?.authType ?? 'none'));
	if (authType === 'none') return { authType };
	const apiKeyHeader =
		authType === 'api-key'
			? input.apiKeyHeader?.trim() || existing?.apiKeyHeader || 'X-API-Key'
			: undefined;
	const canReuse =
		existing?.url === url &&
		existing.authType === authType &&
		(authType !== 'api-key' || existing.apiKeyHeader?.toLowerCase() === apiKeyHeader?.toLowerCase());
	const credential = suppliedCredential || (canReuse ? existing.credential : undefined);
	if (!credential) throw new Error(`A credential is required for A2A ${authType} authentication.`);
	if (new URL(url).protocol !== 'https:') {
		throw new Error('Authenticated A2A agents must use HTTPS.');
	}
	return { authType, credential, ...(apiKeyHeader ? { apiKeyHeader } : {}) };
}
