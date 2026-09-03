import { createBoundedFetch } from '../shared/bounded_fetch';

const MAX_MCP_WIRE_BYTES = 1_000_000;

export function createMcpFetch(fetchImplementation: typeof fetch = fetch): typeof fetch {
	const boundedFetch = createBoundedFetch(
		MAX_MCP_WIRE_BYTES,
		'MCP response exceeded the 1 MB wire limit.',
		fetchImplementation
	);
	return async (input, init): Promise<Response> =>
		boundedFetch(input, { ...init, redirect: 'error' });
}
