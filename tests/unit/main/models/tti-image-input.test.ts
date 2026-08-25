import { normalizeImageSource } from '../../../../src/shared/image_types';
import { createBflImageAdapter } from '../../../../src/main/models/adapters/tti/tti_bfl';
import { createGoogleImageAdapter } from '../../../../src/main/models/adapters/tti/tti_google';
import { createQwenImageAdapter } from '../../../../src/main/models/adapters/tti/tti_qwen';

const source = { base64: 'aGVsbG8=', mimeType: 'image/png' as const };

describe('image source editing adapters', () => {
	it('normalizes supported source images and rejects data URLs', () => {
		expect(normalizeImageSource(source)).toEqual(source);
		expect(() =>
			normalizeImageSource({ ...source, base64: 'data:image/png;base64,aGVsbG8=' })
		).toThrow('Invalid image source data');
	});

	it('sends inline image data to Google generateContent', async () => {
		const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(
				JSON.stringify({
					candidates: [{ content: { parts: [{ inlineData: { data: 'result' } }] } }],
				}),
				{ status: 200, headers: { 'content-type': 'application/json' } }
			)
		);

		await createGoogleImageAdapter({ id: 'google', name: 'Google', apiKey: 'key' }).generate({
			modelId: 'gemini-image',
			prompt: 'revise',
			source,
		});

		const body = JSON.parse(String(fetch.mock.calls[0][1]?.body));
		expect(body.contents[0].parts).toEqual([
			{ inlineData: { mimeType: 'image/png', data: 'aGVsbG8=' } },
			{ text: 'revise' },
		]);
	});

	it('maps source images to BFL Kontext input_image', async () => {
		const fetch = jest
			.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ id: 'job', polling_url: 'https://poll.test' }), {
					status: 200,
					headers: { 'content-type': 'application/json' },
				})
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ status: 'Ready', result: { sample: 'https://image.test' } }),
					{ status: 200, headers: { 'content-type': 'application/json' } }
				)
			)
			.mockResolvedValueOnce(
				new Response(new Uint8Array([1, 2, 3]), {
					status: 200,
					headers: { 'content-type': 'image/png' },
				})
			);

		await createBflImageAdapter({ id: 'black-forest-labs', name: 'BFL', apiKey: 'key' }).generate({
			modelId: 'FLUX.1 Kontext [pro]',
			prompt: 'revise',
			source,
		});

		const body = JSON.parse(String(fetch.mock.calls[0][1]?.body));
		expect(body.input_image).toBe(source.base64);
	});

	it('sends Qwen edit images before the instruction', async () => {
		const fetch = jest
			.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						output: { choices: [{ message: { content: [{ image: 'https://image.test' }] } }] },
					}),
					{ status: 200, headers: { 'content-type': 'application/json' } }
				)
			)
			.mockResolvedValueOnce(
				new Response(new Uint8Array([1, 2, 3]), {
					status: 200,
					headers: { 'content-type': 'image/png' },
				})
			);

		await createQwenImageAdapter({ id: 'qwen', name: 'Qwen', apiKey: 'key' }).generate({
			modelId: 'qwen-image-edit',
			prompt: 'revise',
			source,
		});

		const body = JSON.parse(String(fetch.mock.calls[0][1]?.body));
		expect(body.input.messages[0].content).toEqual([
			{ image: 'data:image/png;base64,aGVsbG8=' },
			{ text: 'revise' },
		]);
	});
});
