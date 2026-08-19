import type { A2aAgent, A2aAgentSummary } from '../../../shared/a2a_types';

export function publicA2aAgent({ token: _token, ...agent }: A2aAgent): A2aAgentSummary {
	return agent;
}
