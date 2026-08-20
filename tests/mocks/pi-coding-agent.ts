export const createAgentSession = jest.fn();
export const modelRuntimeCreate = jest.fn();
export const sessionManagerCreate = jest.fn();
export const sessionManagerList = jest.fn();
export const sessionManagerOpen = jest.fn();

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
	create: sessionManagerCreate,
	inMemory: jest.fn((cwd: string) => ({ cwd })),
	list: sessionManagerList,
	open: sessionManagerOpen,
};

export const SettingsManager = {
	inMemory: jest.fn((settings: unknown, options: unknown) => ({ settings, options })),
};
