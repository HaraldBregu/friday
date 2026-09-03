import type { A2aAgent } from '../../../shared/a2a_types';
import { validateA2aAuthentication } from './validate';
import { createBoundedFetch } from '../../shared/bounded_fetch';

const MAX_A2A_WIRE_BYTES = 256_000;

export function createA2aFetch(
	authentication: Pick<A2aAgent, 'authType' | 'credential' | 'apiKeyHeader' | 'clientId'>,
	tokenProvider?: () => Promise<string>
): typeof fetch {
	const boundedFetch = createBoundedFetch(
		MAX_A2A_WIRE_BYTES,
		'A2A response exceeded the 256 KB wire limit.'
	);
	return async (input, init) => {
		const request = new Request(input, init);
		validateA2aAuthentication(authentication, request.url);
		const headers = new Headers(request.headers);
		headers.set('A2A-Version', '1.0');
		if (authentication.authType === 'private-key-jwt' && tokenProvider) {
			headers.set('Authorization', `Bearer ${await tokenProvider()}`);
		}
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
		return boundedFetch(request, { headers, redirect: 'error' });
	};
}
