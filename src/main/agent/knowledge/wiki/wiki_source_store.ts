import Store from 'electron-store';
import type { WikiSourceRegistry } from './types';
import { wikiPaths } from './wiki_paths';

export const wikiSourceStore = new Store<WikiSourceRegistry>({
	name: 'source-registry',
	cwd: wikiPaths().state,
	accessPropertiesByDotNotation: false,
	configFileMode: 0o600,
	defaults: { version: 1, sources: {} },
});
