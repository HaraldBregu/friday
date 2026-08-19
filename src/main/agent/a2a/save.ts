import { randomUUID } from 'node:crypto';
import type { A2aAgent, A2aAgentInput } from '../../../shared/a2a_types';
import { createA2aClient } from './client';
import { discoverA2aAgent } from './discover';
import { a2aAgentInputSchema } from './schema';
import { getA2aAgents, setA2aAgents } from './store';
import { normalizeA2aUrl } from './url';

export async function saveA2aAgent(input: A2aAgentInput): Promise<A2aAgent> {
	const value = a2aAgentInputSchema.parse(input);
	const agents = getA2aAgents();
	const existing = value.id ? agents.find((agent) => agent.id === value.id) : undefined;
	if (value.id && !existing) throw new Error(`A2A agent not found: ${value.id}`);
	const url = normalizeA2aUrl(value.url);
	const token = value.token?.trim() || (existing?.url === url ? existing.token : undefined);
	const card = await discoverA2aAgent(url, token);
	await createA2aClient(card);
	const agent: A2aAgent = {
		id: existing?.id ?? randomUUID(),
		name: value.name.trim() || card.name,
		url,
		...(token ? { token } : {}),
		enabled: value.enabled ?? existing?.enabled ?? true,
		cardName: card.name,
		description: card.description,
		skills: card.skills.map((skill) => skill.name),
	};
	setA2aAgents(
		existing ? agents.map((item) => (item.id === agent.id ? agent : item)) : [...agents, agent]
	);
	return agent;
}
