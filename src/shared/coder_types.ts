export const CODER_PROVIDER_IDS = ['openai-codex', 'openai', 'anthropic'] as const;
export const CODER_THINKING_LEVELS = [
	'off',
	'minimal',
	'low',
	'medium',
	'high',
	'xhigh',
	'max',
] as const;
export const CODER_TOOL_MODES = ['read-only', 'coding'] as const;

export type CoderProviderId = (typeof CODER_PROVIDER_IDS)[number];
export type CoderThinkingLevel = (typeof CODER_THINKING_LEVELS)[number];
export type CoderToolMode = (typeof CODER_TOOL_MODES)[number];

export interface CoderSettings {
	readonly runtime: 'pi';
	readonly providerId: CoderProviderId;
	readonly modelId: string;
	readonly thinkingLevel: CoderThinkingLevel;
	readonly toolMode: CoderToolMode;
	readonly workingDirectory: string;
}

export interface CoderModel {
	readonly id: string;
	readonly name: string;
	readonly reasoning: boolean;
	readonly contextWindow: number;
}

export interface CoderProvider {
	readonly id: CoderProviderId;
	readonly name: string;
	readonly authentication: 'oauth' | 'api-key';
	readonly configured: boolean;
	readonly authType?: 'oauth' | 'api_key';
	readonly authSource?: string;
	readonly models: readonly CoderModel[];
}

export interface CoderCatalog {
	readonly providers: readonly CoderProvider[];
}

export type CoderResponseEvent =
	| {
			readonly type: 'status';
			readonly runId: string;
			readonly status: 'started' | 'completed' | 'cancelled';
	  }
	| { readonly type: 'text-delta'; readonly runId: string; readonly delta: string }
	| { readonly type: 'thinking-delta'; readonly runId: string; readonly delta: string }
	| {
			readonly type: 'tool-start';
			readonly runId: string;
			readonly toolCallId: string;
			readonly toolName: string;
	  }
	| {
			readonly type: 'tool-end';
			readonly runId: string;
			readonly toolCallId: string;
			readonly toolName: string;
			readonly isError: boolean;
	  }
	| { readonly type: 'error'; readonly runId: string; readonly message: string };

export type CoderAuthEvent =
	| { readonly type: 'progress'; readonly message: string }
	| { readonly type: 'info'; readonly message: string; readonly url?: string }
	| { readonly type: 'auth-url'; readonly url: string; readonly instructions?: string }
	| {
			readonly type: 'device-code';
			readonly userCode: string;
			readonly verificationUri: string;
			readonly expiresInSeconds?: number;
	  };

export interface CoderAuthStatus {
	readonly configured: boolean;
	readonly type?: 'oauth' | 'api_key';
	readonly source?: string;
}

export function isCoderSettings(value: unknown): value is CoderSettings {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
	const settings = value as Partial<CoderSettings>;
	return (
		settings.runtime === 'pi' &&
		typeof settings.providerId === 'string' &&
		CODER_PROVIDER_IDS.includes(settings.providerId as CoderProviderId) &&
		typeof settings.modelId === 'string' &&
		typeof settings.thinkingLevel === 'string' &&
		CODER_THINKING_LEVELS.includes(settings.thinkingLevel as CoderThinkingLevel) &&
		typeof settings.toolMode === 'string' &&
		CODER_TOOL_MODES.includes(settings.toolMode as CoderToolMode) &&
		typeof settings.workingDirectory === 'string' &&
		settings.workingDirectory.trim().length > 0
	);
}
