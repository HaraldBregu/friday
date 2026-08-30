export type A2aAuthType = 'none' | 'bearer' | 'api-key';

export interface A2aAgentInput {
	id?: string;
	name: string;
	url: string;
	authType?: A2aAuthType;
	credential?: string;
	apiKeyHeader?: string;
	token?: string;
	enabled?: boolean;
}

export interface A2aAgent {
	id: string;
	name: string;
	url: string;
	authType: A2aAuthType;
	credential?: string;
	apiKeyHeader?: string;
	enabled: boolean;
	cardName?: string;
	description?: string;
	skills: string[];
}

export type A2aAgentSummary = Omit<A2aAgent, 'credential'> & { hasCredential: boolean };

export interface A2aTestResult {
	name: string;
	description?: string;
	skills: string[];
	streaming: boolean;
	authType: A2aAuthType;
}

export interface A2aApi {
	list: () => Promise<A2aAgentSummary[]>;
	save: (input: A2aAgentInput) => Promise<A2aAgentSummary>;
	delete: (id: string) => Promise<void>;
	test: (input: A2aAgentInput) => Promise<A2aTestResult>;
}
