export function createBoundedFetch(
	maxBytes: number,
	errorMessage: string,
	fetchImplementation: typeof fetch = fetch
): typeof fetch {
	return async (input, init): Promise<Response> => {
		const response = await fetchImplementation(input, init);
		const contentLength = Number(response.headers.get('content-length') ?? 0);
		if (Number.isFinite(contentLength) && contentLength > maxBytes) {
			await response.body?.cancel();
			throw new Error(errorMessage);
		}
		if (!response.body) return response;
		let receivedBytes = 0;
		const body = response.body.pipeThrough(
			new TransformStream<Uint8Array, Uint8Array>({
				transform(chunk, controller) {
					receivedBytes += chunk.byteLength;
					if (receivedBytes > maxBytes) {
						controller.error(new Error(errorMessage));
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
