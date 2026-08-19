import type { AgentCard } from '@a2a-js/sdk';
import { normalizeA2aUrl } from './url';

export async function discoverA2aAgent(
	url: string,
	token?: string,
	signal?: AbortSignal
): Promise<AgentCard> {
	const { DefaultAgentCardResolver } = await import('@a2a-js/sdk/client');
	const base = normalizeA2aUrl(url);
	const authorization = token?.trim();
	const resolver = new DefaultAgentCardResolver({
		fetchImpl: (input, init) => {
			const headers = new Headers(init?.headers);
			if (authorization) headers.set('Authorization', `Bearer ${authorization}`);
			return fetch(input, { ...init, headers, signal: signal ?? init?.signal });
		},
	});
	return resolver.resolve(base);
}
