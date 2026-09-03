import type { AgentCard } from '@a2a-js/sdk';
import type { Client } from '@a2a-js/sdk/client';
import type { A2aAgent } from '../../../shared/a2a_types';
import { createA2aClient } from './client';
import { discoverA2aAgent } from './discover';
import { sanitizeA2aError } from './error';
import { validateA2aAuthentication } from './validate';

export async function connectA2aAgent(
	url: string,
	authentication: Pick<A2aAgent, 'authType' | 'credential' | 'apiKeyHeader'>,
	signal?: AbortSignal
): Promise<{ card: AgentCard; client: Client }> {
	const timeout = AbortSignal.timeout(15_000);
	const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
	try {
		validateA2aAuthentication(authentication, url);
		let card = await discoverA2aAgent(url, authentication, requestSignal);
		let client = await createA2aClient(card, authentication, url, signal);
		if (authentication.credential && card.capabilities?.extendedAgentCard) {
			card = await client.getAgentCard({ signal: requestSignal });
			client = await createA2aClient(card, authentication, url, signal);
		}
		return { card, client };
	} catch (error) {
		throw sanitizeA2aError(error, authentication);
	}
}
