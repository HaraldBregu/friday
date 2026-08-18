import { DefaultAgentCardResolver } from '@a2a-js/sdk/client';
import type { AgentCard } from '@a2a-js/sdk';

export async function discoverA2aAgent(url: string, token?: string): Promise<AgentCard> {
	const base = url.trim().replace(/\/$/, '');
	if (!base) throw new Error('A2A agent URL is required.');
	if (!token?.trim()) return new DefaultAgentCardResolver().resolve(base);
	const response = await fetch(`${base}/.well-known/agent-card.json`, {
		headers: { authorization: `Bearer ${token.trim()}` },
	});
	if (!response.ok) throw new Error(`Agent Card request failed: ${response.status}.`);
	return new DefaultAgentCardResolver().normalizeAgentCard(await response.json());
}
