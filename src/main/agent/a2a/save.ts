import { randomUUID } from 'node:crypto';
import type { A2aAgent, A2aAgentInput } from '../../../shared/a2a_types';
import { discoverA2aAgent } from './discover';
import { getA2aAgents, setA2aAgents } from './store';

export async function saveA2aAgent(input: A2aAgentInput): Promise<A2aAgent> {
	const card = await discoverA2aAgent(input.url, input.token);
	const agents = getA2aAgents();
	const existing = input.id ? agents.find((agent) => agent.id === input.id) : undefined;
	const agent: A2aAgent = {
		id: existing?.id ?? randomUUID(),
		name: input.name.trim() || card.name,
		url: input.url.trim().replace(/\/$/, ''),
		...(input.token?.trim() ? { token: input.token.trim() } : {}),
		enabled: input.enabled ?? existing?.enabled ?? true,
		cardName: card.name,
		description: card.description,
		skills: card.skills.map((skill) => skill.name),
	};
	setA2aAgents(existing ? agents.map((item) => (item.id === agent.id ? agent : item)) : [...agents, agent]);
	return agent;
}
