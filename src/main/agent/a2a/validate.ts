import type { A2aAgent } from '../../../shared/a2a_types';

export function validateA2aAuthentication(
	authentication: Pick<A2aAgent, 'authType' | 'credential' | 'apiKeyHeader' | 'clientId'>,
	url: string
): void {
	if (!['none', 'bearer', 'api-key', 'private-key-jwt'].includes(authentication.authType)) {
		throw new Error('Invalid stored A2A authentication type.');
	}
	if (authentication.authType === 'none') {
		if (authentication.credential)
			throw new Error('Unauthenticated A2A agents cannot store credentials.');
		return;
	}
	if (!authentication.credential) throw new Error('A2A authentication credential is unavailable.');
	if (authentication.authType === 'private-key-jwt' && !authentication.clientId) {
		throw new Error('A2A OAuth client ID is unavailable.');
	}
	let target: URL;
	try {
		target = new URL(url);
	} catch {
		throw new Error('A2A authentication target must be an absolute URL.');
	}
	if (target.protocol !== 'https:') throw new Error('Authenticated A2A agents must use HTTPS.');
	if (authentication.authType === 'api-key') {
		const header = authentication.apiKeyHeader ?? '';
		if (!/^[!#$%&'*+\-.^_`|~0-9A-Za-z]{1,128}$/.test(header)) {
			throw new Error('Invalid stored A2A API key header.');
		}
		if (
			[
				'a2a-extensions',
				'a2a-version',
				'connection',
				'content-length',
				'host',
				'transfer-encoding',
			].includes(header.toLowerCase())
		) {
			throw new Error('Stored A2A API key header is reserved or unsafe.');
		}
	}
}
