export const MCP_SECRET_KEYS = [
	'token',
	'client_secret',
	'refresh_token',
	'tokens',
	'codeVerifier',
	'env',
] as const;

export type McpSecretKey = (typeof MCP_SECRET_KEYS)[number];
export type McpSecrets = Partial<Record<McpSecretKey, unknown>>;
