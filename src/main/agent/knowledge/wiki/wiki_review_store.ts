import Store from 'electron-store';
import type { WikiReviewQueue } from './types';
import { wikiPaths } from './wiki_paths';

export const wikiReviewStore = new Store<WikiReviewQueue>({
	name: 'pending-review',
	cwd: wikiPaths().state,
	accessPropertiesByDotNotation: false,
	configFileMode: 0o600,
	defaults: { version: 1, items: [] },
});
