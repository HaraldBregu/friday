export interface A2aAgentInput {
	id?: string;
	name: string;
	url: string;
	token?: string;
	enabled?: boolean;
}

export interface A2aAgent {
	id: string;
	name: string;
	url: string;
	token?: string;
	enabled: boolean;
	cardName?: string;
	description?: string;
	skills: string[];
}

export type A2aAgentSummary = Omit<A2aAgent, 'token'>;

export interface A2aTestResult {
	name: string;
	description?: string;
	skills: string[];
	streaming: boolean;
}

export interface A2aApi {
	list: () => Promise<A2aAgentSummary[]>;
	save: (input: A2aAgentInput) => Promise<A2aAgentSummary>;
	delete: (id: string) => Promise<void>;
	test: (input: A2aAgentInput) => Promise<A2aTestResult>;
}
