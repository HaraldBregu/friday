import type { A2aAgent } from '../../../shared/a2a_types';
import type { A2aStoredAgent } from './stored';

export function preserveA2aCredential(
	agent: A2aAgent,
	preserved: A2aStoredAgent
): A2aStoredAgent | undefined {
	const preservedAuthType =
		preserved.authType ??
		(preserved.credential || preserved.token || preserved.encryptedCredential ? 'bearer' : 'none');
	if (
		preserved.url !== agent.url ||
		preservedAuthType !== agent.authType ||
		(preserved.apiKeyHeader ?? '') !== (agent.apiKeyHeader ?? '')
	) {
		return undefined;
	}
	const { credential: _credential, ...record } = agent;
	return {
		...record,
		...(preserved.credential !== undefined ? { credential: preserved.credential } : {}),
		...(preserved.token !== undefined ? { token: preserved.token } : {}),
		...(preserved.encryptedCredential !== undefined
			? { encryptedCredential: preserved.encryptedCredential }
			: {}),
	};
}
