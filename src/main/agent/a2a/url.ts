export function normalizeA2aUrl(value: string): string {
	let url: URL;
	try {
		url = new URL(value.trim());
	} catch {
		throw new Error('A2A agent URL must be an absolute HTTP or HTTPS URL.');
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new Error('A2A agent URL must use HTTP or HTTPS.');
	}
	if (url.username || url.password) throw new Error('A2A agent URL must not contain credentials.');
	if (url.search || url.hash)
		throw new Error('A2A agent URL must not contain a query or fragment.');
	return url.toString().replace(/\/+$/, '');
}
