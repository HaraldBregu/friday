import type { A2aAgent } from '../../../shared/a2a_types';

export function createA2aFetch(
	authentication: Pick<A2aAgent, 'authType' | 'credential' | 'apiKeyHeader'>
): typeof fetch {
	return async (input, init) => {
		const request = new Request(input, init);
		const headers = new Headers(request.headers);
		if (authentication.authType === 'bearer' && authentication.credential) {
			headers.set('Authorization', `Bearer ${authentication.credential}`);
		}
		if (
			authentication.authType === 'api-key' &&
			authentication.credential &&
			authentication.apiKeyHeader
		) {
			headers.set(authentication.apiKeyHeader, authentication.credential);
		}
		return fetch(request, { headers, redirect: 'error' });
	};
}
