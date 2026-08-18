import type { A2aAgentInput, A2aTestResult } from '../../../shared/a2a_types';
import { discoverA2aAgent } from './discover';

export async function testA2aAgent(input: A2aAgentInput): Promise<A2aTestResult> {
	const card = await discoverA2aAgent(input.url, input.token);
	return {
		name: card.name,
		description: card.description,
		skills: card.skills.map((skill) => skill.name),
		streaming: card.capabilities?.streaming ?? false,
	};
}
