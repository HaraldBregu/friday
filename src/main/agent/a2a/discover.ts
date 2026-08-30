import type { AgentCard } from '@a2a-js/sdk';
import type { A2aAgent } from '../../../shared/a2a_types';
import { createA2aFetch } from './fetch';
import { normalizeA2aUrl } from './url';

const MAX_AGENT_CARD_BYTES = 256_000;

export async function discoverA2aAgent(
	url: string,
	authentication: Pick<A2aAgent, 'authType' | 'credential' | 'apiKeyHeader'>,
	signal?: AbortSignal
): Promise<AgentCard> {
	const { DefaultAgentCardResolver } = await import('@a2a-js/sdk/client');
	const base = normalizeA2aUrl(url);
	const authenticatedFetch = createA2aFetch(authentication);
	const resolver = new DefaultAgentCardResolver({
		fetchImpl: async (input, init) => {
			const response = await authenticatedFetch(input, {
				...init,
				signal: signal ?? init?.signal,
			});
			const contentLength = Number(response.headers.get('content-length') ?? 0);
			if (contentLength > MAX_AGENT_CARD_BYTES) {
				throw new Error('A2A Agent Card exceeded the 256 KB limit.');
			}
			const body = await response.arrayBuffer();
			if (body.byteLength > MAX_AGENT_CARD_BYTES) {
				throw new Error('A2A Agent Card exceeded the 256 KB limit.');
			}
			return new Response(body, {
				status: response.status,
				statusText: response.statusText,
				headers: response.headers,
			});
		},
	});
	return resolver.resolve(base);
}
