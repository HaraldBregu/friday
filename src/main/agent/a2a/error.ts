import type { A2aAgent } from '../../../shared/a2a_types';

export function sanitizeA2aError(
	error: unknown,
	authentication?: Pick<A2aAgent, 'credential'>
): Error {
	const original = error instanceof Error ? error : new Error(String(error));
	let message = original.message;
	const credential = authentication?.credential;
	if (credential) {
		message = message.replaceAll(credential, '[REDACTED]');
		try {
			message = message.replaceAll(encodeURIComponent(credential), '[REDACTED]');
		} catch {}
	}
	const sanitized = new Error(message.slice(0, 2_000));
	sanitized.name = original.name;
	return sanitized;
}
