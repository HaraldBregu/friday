import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export const createAgentSession = jest.fn();
export const modelRuntimeCreate = jest.fn();
export const sessionManagerCreate = jest.fn();
export const sessionManagerList = jest.fn();
export const sessionManagerOpen = jest.fn();

export const loadProjectContextFiles = jest.fn(
	({ cwd, agentDir }: { cwd: string; agentDir: string }) => {
		const candidates = ['AGENTS.override.md', 'AGENTS.md', 'AGENTS.MD', 'CLAUDE.md', 'CLAUDE.MD'];
		const load = (directory: string): { path: string; content: string } | undefined => {
			for (const candidate of candidates) {
				const filePath = path.join(directory, candidate);
				if (existsSync(filePath) && statSync(filePath).isFile()) {
					return { path: filePath, content: readFileSync(filePath, 'utf8') };
				}
			}
			return undefined;
		};
		const files: { path: string; content: string }[] = [];
		const globalFile = load(agentDir);
		if (globalFile) files.push(globalFile);
		const ancestors: { path: string; content: string }[] = [];
		let directory = path.resolve(cwd);
		while (true) {
			const file = load(directory);
			if (file && file.path !== globalFile?.path) ancestors.unshift(file);
			const parent = path.dirname(directory);
			if (parent === directory) break;
			directory = parent;
		}
		return [...files, ...ancestors];
	}
);

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
