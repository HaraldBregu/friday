import Store from 'electron-store';
import type { WikiFailureRegistry } from './types';
import { wikiPaths } from './wiki_paths';

export const wikiFailureStore = new Store<WikiFailureRegistry>({
	name: 'failed-operations',
	cwd: wikiPaths().state,
	accessPropertiesByDotNotation: false,
	configFileMode: 0o600,
	defaults: { version: 1, operations: [] },
});
