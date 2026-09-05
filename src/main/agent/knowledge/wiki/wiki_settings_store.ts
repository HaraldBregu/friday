import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import Store from 'electron-store';
import type { WikiSettings } from '../../../../shared/wiki_types';
import { userDataLocation } from '../../../shared/user_data_location';
import { wikiLocation } from './wiki_location';

export const DEFAULT_WIKI_SETTINGS: WikiSettings = {
	enabled: false,
	providerId: '',
	modelId: '',
	sourcePath: path.resolve(wikiLocation(), 'raw'),
	targetPath: path.resolve(wikiLocation(), 'data'),
	autoFileAnswers: false,
	requireReviewForMajorChanges: true,
	retrievalPriority: 'wiki_first',
	lintOnStartup: false,
	schedule: {
		enabled: false,
		cronExpression: '0 3 * * *',
	},
};

const settingsDirectory = path.resolve(userDataLocation(), 'settings');
const settingsPath = path.resolve(settingsDirectory, 'wiki.json');
const legacySettingsPath = path.resolve(wikiLocation(), 'settings.json');
const shouldMigrateLegacySettings = !existsSync(settingsPath) && existsSync(legacySettingsPath);

export const wikiSettingsStore = new Store<WikiSettings>({
	name: 'wiki',
	cwd: settingsDirectory,
	accessPropertiesByDotNotation: false,
	configFileMode: 0o600,
	defaults: DEFAULT_WIKI_SETTINGS,
});

if (shouldMigrateLegacySettings) {
	const legacySettings = JSON.parse(
		readFileSync(legacySettingsPath, 'utf8')
	) as Partial<WikiSettings>;
	wikiSettingsStore.store = {
		...DEFAULT_WIKI_SETTINGS,
		...legacySettings,
		schedule: {
			...DEFAULT_WIKI_SETTINGS.schedule,
			...legacySettings.schedule,
		},
	};
}
