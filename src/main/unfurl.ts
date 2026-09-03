import type { UrlMetadata } from '../shared/app_types';
import { responseText } from './body';
import { metadata } from './metadata';
import { publicRequest } from './request';

export async function unfurlUrl(value: string): Promise<UrlMetadata> {
	let url = new URL(value);
	for (let redirects = 0; redirects <= 5; redirects += 1) {
		const result = await publicRequest(url.toString(), {
			headers: { Accept: 'text/html,application/xhtml+xml' },
		});
		const { response } = result;
		url = result.url;
		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get('location');
			if (!location || redirects === 5) throw new Error('Too many redirects.');
			url = new URL(location, url);
			continue;
		}
		if (!response.ok) throw new Error(`URL returned ${response.status}.`);
		const contentType = response.headers.get('content-type') ?? '';
		if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
			throw new Error('URL did not return an HTML page.');
		}
		const length = Number(response.headers.get('content-length') ?? 0);
		if (length > 1_000_000) throw new Error('Page is too large.');
		const html = await responseText(response, 1_000_000);
		return metadata(html, url);
	}
	throw new Error('Unable to load URL.');
}
