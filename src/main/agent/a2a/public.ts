import type { A2aAgent, A2aAgentSummary } from '../../../shared/a2a_types';

export function publicA2aAgent({ credential, ...agent }: A2aAgent): A2aAgentSummary {
	return { ...agent, hasCredential: Boolean(credential) };
}
