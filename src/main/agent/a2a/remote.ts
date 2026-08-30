import type { A2aAgent } from '../../../shared/a2a_types';
import { getA2aAgents } from './store';

export function resolveA2aAgent(agentId: string): A2aAgent {
	const remote = getA2aAgents().find((agent) => agent.enabled && agent.id === agentId);
	if (!remote) throw new Error(`Enabled A2A agent not found: ${agentId}`);
	return remote;
}
