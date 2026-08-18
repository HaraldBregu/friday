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

export interface A2aTestResult {
	name: string;
	description?: string;
	skills: string[];
	streaming: boolean;
}

export interface A2aApi {
	list: () => Promise<A2aAgent[]>;
	save: (input: A2aAgentInput) => Promise<A2aAgent>;
	delete: (id: string) => Promise<void>;
	test: (input: A2aAgentInput) => Promise<A2aTestResult>;
}
