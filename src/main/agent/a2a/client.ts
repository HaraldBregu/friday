import type { AgentCard } from '@a2a-js/sdk';
import type { Client } from '@a2a-js/sdk/client';

const supportedOutputModes = new Set(['text/plain', 'application/json']);

export async function createA2aClient(card: AgentCard): Promise<Client> {
	if (!card || typeof card.name !== 'string' || !card.name.trim()) {
		throw new Error('Invalid A2A Agent Card: name is required.');
	}
	if (!Array.isArray(card.skills) || !Array.isArray(card.supportedInterfaces)) {
		throw new Error('Invalid A2A Agent Card: skills and supported interfaces are required.');
	}
	const requiredExtensions = card.capabilities?.extensions?.filter((extension) => extension.required);
	if (requiredExtensions?.length) {
		throw new Error(
			`A2A agent requires unsupported extension(s): ${requiredExtensions.map((extension) => extension.uri).join(', ')}.`
		);
	}
	if (!card.defaultInputModes?.includes('text/plain')) {
		throw new Error('A2A agent does not accept text/plain input.');
	}
	if (!card.defaultOutputModes?.some((mode) => supportedOutputModes.has(mode))) {
		throw new Error('A2A agent does not provide a supported text or JSON output mode.');
	}
	const { ClientFactory } = await import('@a2a-js/sdk/client');
	return new ClientFactory().createFromAgentCard(card);
}
