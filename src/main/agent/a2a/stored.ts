import type { A2aAgent } from '../../../shared/a2a_types';

export type A2aStoredAgent = Omit<A2aAgent, 'credential'> & {
	credential?: string;
	token?: string;
	encryptedCredential?: string;
};

export interface A2aCredentialPayload {
	version: 1;
	credential: string;
	agentId: string;
	origin: string;
	authType: A2aAgent['authType'];
	apiKeyHeader: string;
}
