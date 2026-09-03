import { randomUUID } from 'node:crypto';
import type { JWK } from 'jose';
import type { A2aAgent } from '../../../shared/a2a_types';
import { createBoundedFetch } from '../../shared/bounded_fetch';

const MAX_A2A_WIRE_BYTES = 256_000;
const A2A_REQUEST_TIMEOUT_MS = 15_000;

export async function createA2aTokenProvider(
	metadataUrl: string,
	resource: string,
	authentication: Pick<A2aAgent, 'clientId' | 'credential'>,
	signal?: AbortSignal
): Promise<() => Promise<string>> {
	const origin = new URL(resource).origin;
	const metadataTarget = new URL(metadataUrl);
	if (metadataTarget.protocol !== 'https:' || metadataTarget.origin !== origin) {
		throw new Error('A2A OAuth metadata must use the configured HTTPS origin.');
	}
	const boundedFetch = createBoundedFetch(
		MAX_A2A_WIRE_BYTES,
		'A2A OAuth response exceeded the 256 KB wire limit.'
	);
	const metadataTimeout = AbortSignal.timeout(A2A_REQUEST_TIMEOUT_MS);
	const metadataSignal = signal ? AbortSignal.any([signal, metadataTimeout]) : metadataTimeout;
	const metadataResponse = await boundedFetch(metadataTarget, {
		redirect: 'error',
		signal: metadataSignal,
	});
	if (!metadataResponse.ok)
		throw new Error(`A2A OAuth discovery failed: ${await metadataResponse.text()}`);
	const metadata = (await metadataResponse.json()) as {
		issuer?: unknown;
		token_endpoint?: unknown;
	};
	if (metadata.issuer !== origin || typeof metadata.token_endpoint !== 'string') {
		throw new Error('A2A OAuth metadata does not match the configured agent.');
	}
	const tokenEndpoint = new URL(metadata.token_endpoint);
	if (tokenEndpoint.protocol !== 'https:' || tokenEndpoint.origin !== origin) {
		throw new Error('A2A OAuth token endpoint must use the configured HTTPS origin.');
	}
	const clientId = authentication.clientId;
	if (!clientId || !authentication.credential)
		throw new Error('A2A OAuth credentials are unavailable.');
	let privateJwk: JWK;
	try {
		privateJwk = JSON.parse(authentication.credential) as JWK;
	} catch {
		throw new Error('A2A OAuth private key must be a valid JWK.');
	}
	const { importJWK, SignJWT } = await import('jose');
	const key = await importJWK(privateJwk, 'EdDSA');
	let cached: { token: string; expiresAt: number } | undefined;
	return async () => {
		if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;
		const now = Math.floor(Date.now() / 1000);
		const assertion = await new SignJWT()
			.setProtectedHeader({ alg: 'EdDSA', typ: 'JWT' })
			.setIssuer(clientId)
			.setSubject(clientId)
			.setAudience(tokenEndpoint.href)
			.setIssuedAt(now)
			.setExpirationTime(now + 120)
			.setJti(randomUUID())
			.sign(key);
		const timeout = AbortSignal.timeout(A2A_REQUEST_TIMEOUT_MS);
		const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
		const response = await boundedFetch(tokenEndpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: clientId,
				client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
				client_assertion: assertion,
				scope: 'a2a.invoke',
				resource,
			}),
			redirect: 'error',
			signal: requestSignal,
		});
		if (!response.ok) throw new Error(`A2A OAuth token request failed: ${await response.text()}`);
		const value = (await response.json()) as { access_token?: unknown; expires_in?: unknown };
		if (typeof value.access_token !== 'string')
			throw new Error('A2A OAuth response omitted access_token.');
		const expiresIn = typeof value.expires_in === 'number' ? value.expires_in : 300;
		cached = { token: value.access_token, expiresAt: Date.now() + expiresIn * 1000 };
		return cached.token;
	};
}
