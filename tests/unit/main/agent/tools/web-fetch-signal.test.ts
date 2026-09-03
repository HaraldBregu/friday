const publicRequest = jest.fn();

jest.mock('../../../../../src/main/request', () => ({ publicRequest }));

import { fetchWebPageTool } from '../../../../../src/main/agent/tools/web/fetch_web_page';

it('combines the run signal with its request timeout', async () => {
	let requestStarted: (() => void) | undefined;
	const started = new Promise<void>((resolve) => {
		requestStarted = resolve;
	});
	publicRequest.mockImplementation((_url, init) => {
		requestStarted?.();
		return new Promise((_resolve, reject) => {
			init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
		});
	});
	const controller = new AbortController();
	const result = fetchWebPageTool.run({ url: 'https://example.com' }, controller.signal);
	await started;
	const reason = new Error('cancel fetch');
	controller.abort(reason);

	await expect(result).rejects.toBe(reason);
	const init = publicRequest.mock.calls[0][1] as RequestInit;
	expect(init.signal?.aborted).toBe(true);
});
