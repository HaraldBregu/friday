import type { A2aAgent, A2aAgentSummary } from '../../../shared/a2a_types';

export function publicA2aAgent(value: A2aAgent): A2aAgentSummary {
	const { credential, ...record } = value;
	const { token: _legacyToken, ...agent } = record as typeof record & { token?: string };
	return { ...agent, hasCredential: Boolean(credential) };
}
