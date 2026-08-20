export const createAgentSession = jest.fn();
export const modelRuntimeCreate = jest.fn();

export const ModelRuntime = {
	create: modelRuntimeCreate,
};

export class DefaultResourceLoader {
	static readonly instances: DefaultResourceLoader[] = [];
	readonly options: unknown;
	readonly reload = jest.fn(async () => undefined);

	constructor(options: unknown) {
		this.options = options;
		DefaultResourceLoader.instances.push(this);
	}
}

export const SessionManager = {
	inMemory: jest.fn((cwd: string) => ({ cwd })),
};

export const SettingsManager = {
	inMemory: jest.fn((settings: unknown, options: unknown) => ({ settings, options })),
};
