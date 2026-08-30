import { createA2aFetch } from '../../../../src/main/agent/a2a/fetch';

const originalFetch = global.fetch;

afterAll(() => {
	global.fetch = originalFetch;
});

it.each([
	[
		{ authType: 'bearer' as const, credential: 'bearer-secret' },
		'Authorization',
		'Bearer bearer-secret',
	],
	[
		{ authType: 'api-key' as const, credential: 'api-secret', apiKeyHeader: 'X-API-Key' },
		'X-API-Key',
		'api-secret',
	],
])('injects configured authentication and rejects redirects', async (authentication, name, value) => {
	global.fetch = jest.fn().mockResolvedValue(new Response('{}'));
	await createA2aFetch(authentication)('https://agent.example/a2a', {
		headers: { 'A2A-Version': '1.0' },
	});
	const [request, init] = (global.fetch as jest.Mock).mock.calls[0] as [Request, RequestInit];
	expect(request.url).toBe('https://agent.example/a2a');
	expect(new Headers(init.headers).get(name)).toBe(value);
	expect(new Headers(init.headers).get('A2A-Version')).toBe('1.0');
	expect(init.redirect).toBe('error');
});
