import type { A2aAgent } from '../../../shared/a2a_types';
import { validateA2aAuthentication } from './validate';

const MAX_A2A_WIRE_BYTES = 256_000;

export function createA2aFetch(
	authentication: Pick<A2aAgent, 'authType' | 'credential' | 'apiKeyHeader' | 'clientId'>,
	tokenProvider?: () => Promise<string>
): typeof fetch {
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
		const response = await fetch(request, { headers, redirect: 'error' });
		const contentLength = Number(response.headers.get('content-length') ?? 0);
		if (contentLength > MAX_A2A_WIRE_BYTES) {
			throw new Error('A2A response exceeded the 256 KB wire limit.');
		}
		if (!response.body) return response;
		let receivedBytes = 0;
		const body = response.body.pipeThrough(
			new TransformStream<Uint8Array, Uint8Array>({
				transform(chunk, controller) {
					receivedBytes += chunk.byteLength;
					if (receivedBytes > MAX_A2A_WIRE_BYTES) {
						controller.error(new Error('A2A response exceeded the 256 KB wire limit.'));
						return;
					}
					controller.enqueue(chunk);
				},
			})
		);
		return new Response(body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	};
}
