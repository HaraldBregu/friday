import type { AgentCard } from '@a2a-js/sdk';
import type { Client } from '@a2a-js/sdk/client';
import type { A2aAgent } from '../../../shared/a2a_types';
import { createA2aFetch } from './fetch';
import { createA2aTokenProvider } from './oauth';

const supportedOutputModes = new Set(['text/plain', 'application/json']);
const supportedBindings = new Set(['jsonrpc', 'http+json']);

export async function createA2aClient(
	card: AgentCard,
	authentication: Pick<A2aAgent, 'authType' | 'credential' | 'apiKeyHeader' | 'clientId'>,
	discoveryUrl: string
): Promise<Client> {
	if (!card || typeof card.name !== 'string' || !card.name.trim()) {
		throw new Error('Invalid A2A Agent Card: name is required.');
	}
	if (
		!Array.isArray(card.skills) ||
		!Array.isArray(card.supportedInterfaces) ||
		card.supportedInterfaces.length === 0
	) {
		throw new Error('Invalid A2A Agent Card: skills and supported interfaces are required.');
	}
	const supportedInterface = card.supportedInterfaces.find(
		(item) =>
			item.protocolVersion === '1.0' && supportedBindings.has(item.protocolBinding.toLowerCase())
	);
	if (!supportedInterface) {
		throw new Error(
			'A2A Agent Card does not advertise a supported v1.0 JSON-RPC or HTTP+JSON interface.'
		);
	}
	let endpoint: URL;
	try {
		endpoint = new URL(supportedInterface.url);
	} catch {
		throw new Error('Invalid A2A Agent Card: selected interface URL must be absolute.');
	}
	if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) {
		throw new Error(
			'Invalid A2A Agent Card: selected interface must be HTTP(S) without credentials.'
		);
	}
	if (endpoint.origin !== new URL(discoveryUrl).origin) {
		throw new Error('A2A interface must match the configured agent origin.');
	}
	if (authentication.credential && endpoint.protocol !== 'https:') {
		throw new Error('Authenticated A2A interfaces must use HTTPS.');
	}
	const requiredExtensions = card.capabilities?.extensions?.filter(
		(extension) => extension.required
	);
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
	const requirements = card.securityRequirements ?? [];
	let authenticationSatisfied = requirements.length === 0;
	for (const requirement of requirements) {
		const schemeNames = Object.keys(requirement.schemes ?? {});
		if (schemeNames.length === 0) {
			authenticationSatisfied = true;
			break;
		}
		if (schemeNames.length !== 1 || !authentication.credential) continue;
		const scheme = card.securitySchemes?.[schemeNames[0]]?.scheme;
		if (
			authentication.authType === 'api-key' &&
			scheme?.$case === 'apiKeySecurityScheme' &&
			scheme.value.location.toLowerCase() === 'header' &&
			scheme.value.name.toLowerCase() === authentication.apiKeyHeader?.toLowerCase()
		) {
			authenticationSatisfied = true;
			break;
		}
		if (
			(authentication.authType === 'bearer' || authentication.authType === 'private-key-jwt') &&
			((scheme?.$case === 'httpAuthSecurityScheme' &&
				scheme.value.scheme.toLowerCase() === 'bearer') ||
				scheme?.$case === 'oauth2SecurityScheme' ||
				scheme?.$case === 'openIdConnectSecurityScheme')
		) {
			authenticationSatisfied = true;
			break;
		}
	}
	if (!authenticationSatisfied) {
		throw new Error(
			`A2A agent authentication requirements are not satisfied by configured ${authentication.authType} authentication.`
		);
	}
	const { ClientFactory, JsonRpcTransportFactory, RestTransportFactory } =
		await import('@a2a-js/sdk/client');
	let tokenProvider: (() => Promise<string>) | undefined;
	if (authentication.authType === 'private-key-jwt') {
		const oauthScheme = Object.values(card.securitySchemes ?? {}).find(
			(item) => item.scheme?.$case === 'oauth2SecurityScheme'
		)?.scheme;
		const metadataUrl =
			oauthScheme?.$case === 'oauth2SecurityScheme'
				? oauthScheme.value.oauth2MetadataUrl
				: undefined;
		if (!metadataUrl) throw new Error('A2A Agent Card does not advertise OAuth metadata.');
		tokenProvider = await createA2aTokenProvider(metadataUrl, endpoint.href, authentication);
	}
	const fetchImpl = createA2aFetch(authentication, tokenProvider);
	const compatibleCard = { ...card, supportedInterfaces: [supportedInterface] };
	return new ClientFactory({
		transports: [
			new JsonRpcTransportFactory({ fetchImpl }),
			new RestTransportFactory({ fetchImpl }),
		],
	}).createFromAgentCard(compatibleCard);
}
