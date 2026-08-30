import { safeStorage } from 'electron';
import type { A2aAgent } from '../../../shared/a2a_types';
import type { A2aCredentialPayload, A2aStoredAgent } from './stored';

export function sealA2aAgent(agent: A2aAgent): {
	record: A2aStoredAgent;
	volatileCredential?: string;
} {
	const { credential, ...record } = agent;
	if (!credential) return { record };
	if (!safeStorage.isEncryptionAvailable()) return { record, volatileCredential: credential };
	const payload: A2aCredentialPayload = {
		version: 1,
		credential,
		agentId: agent.id,
		origin: new URL(agent.url).origin,
		authType: agent.authType,
		apiKeyHeader: agent.apiKeyHeader ?? '',
	};
	return {
		record: {
			...record,
			encryptedCredential: safeStorage.encryptString(JSON.stringify(payload)).toString('base64'),
		},
	};
}
