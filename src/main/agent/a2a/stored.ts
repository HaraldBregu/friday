import type { A2aAgent } from '../../../shared/a2a_types';

export type A2aStoredAgent = Omit<A2aAgent, 'credential'> & {
	credential?: string;
	token?: string;
	encryptedCredential?: string;
};
