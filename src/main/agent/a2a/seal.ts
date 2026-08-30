import { safeStorage } from 'electron';
import type { A2aAgent } from '../../../shared/a2a_types';
import type { A2aStoredAgent } from './stored';

export function sealA2aAgent(agent: A2aAgent): {
	record: A2aStoredAgent;
	volatileCredential?: string;
} {
	const { credential, ...record } = agent;
	if (!credential) return { record };
	if (!safeStorage.isEncryptionAvailable()) return { record, volatileCredential: credential };
	return {
		record: {
			...record,
			encryptedCredential: safeStorage.encryptString(credential).toString('base64'),
		},
	};
}
