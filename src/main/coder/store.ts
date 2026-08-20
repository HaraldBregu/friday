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
import { userDataLocation } from '../shared/user_data_location';

export const DEFAULT_CODER_SETTINGS: CoderSettings = {
	runtime: 'pi',
	providerId: 'openai-codex',
	modelId: '',
	thinkingLevel: 'medium',
	toolMode: 'read-only',
};

type StoredCoderSettings = CoderSettings & { workingDirectory?: string };

function normalizeSettings(value: unknown): CoderSettings {
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
	};
}

export class CoderStore {
	private readonly store: Store<StoredCoderSettings>;
	private readonly legacyWorkingDirectory?: string;

	constructor(directory = path.resolve(userDataLocation(), 'settings')) {
		this.store = new Store<StoredCoderSettings>({
			name: 'coder',
			cwd: directory,
			accessPropertiesByDotNotation: false,
			defaults: DEFAULT_CODER_SETTINGS,
		});
		const legacyDirectory = this.store.store.workingDirectory;
		this.legacyWorkingDirectory =
			typeof legacyDirectory === 'string' && path.isAbsolute(legacyDirectory)
				? path.resolve(legacyDirectory)
				: undefined;
		this.store.store = normalizeSettings(this.store.store);
	}

	get(): CoderSettings {
		return normalizeSettings(this.store.store);
	}

	set(settings: CoderSettings): CoderSettings {
		if (!isCoderSettings(settings)) throw new Error('Invalid coder settings.');
		const normalized = normalizeSettings(settings);
		this.store.store = normalized;
		return normalized;
	}

	getLegacyWorkingDirectory(): string | undefined {
		return this.legacyWorkingDirectory;
	}
}
