import Store from 'electron-store';
import type { WikiPageManifest } from './types';
import { wikiPaths } from './wiki_paths';

export const wikiManifestStore = new Store<WikiPageManifest>({
	name: 'page-manifest',
	cwd: wikiPaths().state,
	accessPropertiesByDotNotation: false,
	configFileMode: 0o600,
	defaults: { version: 1, pages: {} },
});
