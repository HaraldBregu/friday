import path from 'node:path';
import Store from 'electron-store';
import {
	CODER_PROVIDER_IDS,
	CODER_THINKING_LEVELS,
	CODER_TOOL_MODES,
	isCoderSettings,
	type CoderProviderId,
	type CoderSettings,
	type CoderThinkingLevel,
	type CoderToolMode,
} from '../../shared/coder_types';
import { agentLocation } from '../shared/agent_location';
import { userDataLocation } from '../shared/user_data_location';

export const DEFAULT_CODER_SETTINGS: CoderSettings = {
	runtime: 'pi',
	providerId: 'openai-codex',
	modelId: '',
	thinkingLevel: 'medium',
	toolMode: 'read-only',
	workingDirectory: agentLocation(),
};

function normalizeSettings(value: unknown): CoderSettings {
	if (isCoderSettings(value)) {
		return { ...value, workingDirectory: path.resolve(value.workingDirectory) };
	}
	const stored = value && typeof value === 'object' ? (value as Partial<CoderSettings>) : {};
	const providerId = CODER_PROVIDER_IDS.includes(stored.providerId as CoderProviderId)
		? (stored.providerId as CoderProviderId)
		: DEFAULT_CODER_SETTINGS.providerId;
	const thinkingLevel = CODER_THINKING_LEVELS.includes(stored.thinkingLevel as CoderThinkingLevel)
		? (stored.thinkingLevel as CoderThinkingLevel)
		: DEFAULT_CODER_SETTINGS.thinkingLevel;
	const toolMode = CODER_TOOL_MODES.includes(stored.toolMode as CoderToolMode)
		? (stored.toolMode as CoderToolMode)
		: DEFAULT_CODER_SETTINGS.toolMode;
	return {
		runtime: 'pi',
		providerId,
		modelId: typeof stored.modelId === 'string' ? stored.modelId.trim() : '',
		thinkingLevel,
		toolMode,
		workingDirectory:
			typeof stored.workingDirectory === 'string' && stored.workingDirectory.trim()
				? path.resolve(stored.workingDirectory)
				: DEFAULT_CODER_SETTINGS.workingDirectory,
	};
}

export class CoderStore {
	private readonly store: Store<CoderSettings>;

	constructor(directory = path.resolve(userDataLocation(), 'settings')) {
		this.store = new Store<CoderSettings>({
			name: 'coder',
			cwd: directory,
			accessPropertiesByDotNotation: false,
			defaults: DEFAULT_CODER_SETTINGS,
		});
		this.store.store = normalizeSettings(this.store.store);
	}

	get(): CoderSettings {
		return normalizeSettings(this.store.store);
	}

	set(settings: CoderSettings): CoderSettings {
		if (!isCoderSettings(settings)) throw new Error('Invalid coder settings.');
		if (!path.isAbsolute(settings.workingDirectory)) {
			throw new Error('Coder working directory must be an absolute path.');
		}
		const normalized = normalizeSettings(settings);
		this.store.store = normalized;
		return normalized;
	}
}
