import type { OAuthClientMetadata } from '@modelcontextprotocol/sdk/shared/auth.js';

export const MCP_OAUTH_REDIRECT_URL =
	process.env.MCP_OAUTH_REDIRECT_URL?.trim() || 'https://kucedr.haraldbregu.com/';

export function clientMetadata(hasSecret: boolean): OAuthClientMetadata {
	return {
		client_name: 'Kucedr',
		redirect_uris: [MCP_OAUTH_REDIRECT_URL],
		grant_types: ['authorization_code', 'refresh_token'],
		response_types: ['code'],
		token_endpoint_auth_method: hasSecret ? 'client_secret_post' : 'none',
	};
}
