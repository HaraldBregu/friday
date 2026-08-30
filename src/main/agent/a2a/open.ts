import { safeStorage } from 'electron';
import type { A2aAgent } from '../../../shared/a2a_types';
import type { A2aStoredAgent } from './stored';

export function openA2aAgent(
	record: A2aStoredAgent,
	volatileCredential?: string
): { agent: A2aAgent; hasPlaintextCredential: boolean } {
	const data = { ...record };
	let credential = volatileCredential;
	let hasPlaintextCredential = false;
	if (typeof data.credential === 'string' && data.credential.trim()) {
		credential = data.credential.trim();
		hasPlaintextCredential = true;
	} else if (typeof data.token === 'string' && data.token.trim()) {
		credential = data.token.trim();
		hasPlaintextCredential = true;
	}
	if (typeof data.encryptedCredential === 'string' && safeStorage.isEncryptionAvailable()) {
		try {
			credential = safeStorage.decryptString(Buffer.from(data.encryptedCredential, 'base64'));
		} catch {
			credential = undefined;
		}
	}
	delete data.credential;
	delete data.token;
	delete data.encryptedCredential;
	const authType = data.authType ?? (credential ? 'bearer' : 'none');
	return {
		agent: { ...data, authType, ...(credential ? { credential } : {}) },
		hasPlaintextCredential,
	};
}
