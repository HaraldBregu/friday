import type { A2aAgentInput, A2aTestResult } from '../../../shared/a2a_types';
import { resolveA2aAuthentication } from './authentication';
import { connectA2aAgent } from './connect';
import { a2aAgentInputSchema } from './schema';
import { getA2aAgents } from './store';
import { normalizeA2aUrl } from './url';

export async function testA2aAgent(input: A2aAgentInput): Promise<A2aTestResult> {
	const value = a2aAgentInputSchema.parse(input);
	const existing = value.id ? getA2aAgents().find((agent) => agent.id === value.id) : undefined;
	if (value.id && !existing) throw new Error(`A2A agent not found: ${value.id}`);
	const url = normalizeA2aUrl(value.url);
	const authentication = resolveA2aAuthentication(value, existing, url);
	const { card } = await connectA2aAgent(url, authentication);
	return {
		name: card.name,
		description: card.description,
		skills: card.skills.map((skill) => skill.name),
		streaming: card.capabilities?.streaming ?? false,
		authType: authentication.authType,
	};
}
