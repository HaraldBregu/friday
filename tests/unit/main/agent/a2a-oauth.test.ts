import { createA2aTokenProvider } from '../../../../src/main/agent/a2a/oauth';

const originalFetch = global.fetch;

afterEach(() => {
	global.fetch = originalFetch;
});

it('rejects oversized OAuth discovery responses before parsing', async () => {
	global.fetch = jest.fn().mockResolvedValue(new Response('x'.repeat(256_001)));

	await expect(
		createA2aTokenProvider('https://agent.example/oauth', 'https://agent.example/a2a', {
			clientId: 'client',
			credential: '{}',
		})
	).rejects.toThrow('256 KB wire limit');
});

it('passes caller cancellation to OAuth discovery', async () => {
	const controller = new AbortController();
	controller.abort(new Error('cancelled'));
	global.fetch = jest.fn((_input, init) => Promise.reject(init?.signal?.reason));

	await expect(
		createA2aTokenProvider(
			'https://agent.example/oauth',
			'https://agent.example/a2a',
			{ clientId: 'client', credential: '{}' },
			controller.signal
		)
	).rejects.toThrow('cancelled');
	expect((global.fetch as jest.Mock).mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
});
