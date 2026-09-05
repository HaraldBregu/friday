import Store from 'electron-store';
import { realPath } from '../../../shared/real_path';
import { wikiFailureStore } from './wiki_failure_store';
import { wikiManifestStore } from './wiki_manifest_store';
import { wikiOperationStore } from './wiki_operation_store';
import { wikiPaths } from './wiki_paths';
import { wikiReviewStore } from './wiki_review_store';
import { wikiSourceStore } from './wiki_source_store';
import { wikiStateStore } from './wiki_state_store';
import type {
	WikiFailureRegistry,
	WikiOperationRegistry,
	WikiPageManifest,
	WikiRepository,
	WikiReviewQueue,
	WikiSourceRegistry,
	WikiState,
} from './types';

const defaultTargetPath = realPath(wikiPaths().root + '/data');
const defaultRepository: WikiRepository = {
	targetPath: defaultTargetPath,
	paths: wikiPaths(defaultTargetPath),
	sources: wikiSourceStore,
	reviews: wikiReviewStore,
	operations: wikiOperationStore,
	failures: wikiFailureStore,
	manifest: wikiManifestStore,
	state: wikiStateStore,
};
const repositories = new Map<string, WikiRepository>([[defaultTargetPath, defaultRepository]]);

export function getWikiRepository(targetPath: string): WikiRepository {
	const canonicalTarget = realPath(targetPath);
	const existing = repositories.get(canonicalTarget);
	if (existing) return existing;
	const paths = wikiPaths(canonicalTarget);
	const repository: WikiRepository = {
		targetPath: canonicalTarget,
		paths,
		sources: new Store<WikiSourceRegistry>({
			name: 'source-registry',
			cwd: paths.state,
			accessPropertiesByDotNotation: false,
			configFileMode: 0o600,
			defaults: { version: 1, sources: {} },
		}),
		reviews: new Store<WikiReviewQueue>({
			name: 'pending-review',
			cwd: paths.state,
			accessPropertiesByDotNotation: false,
			configFileMode: 0o600,
			defaults: { version: 1, items: [] },
		}),
		operations: new Store<WikiOperationRegistry>({
			name: 'operations',
			cwd: paths.state,
			accessPropertiesByDotNotation: false,
			configFileMode: 0o600,
			defaults: { version: 1, operations: {} },
		}),
		failures: new Store<WikiFailureRegistry>({
			name: 'failed-operations',
			cwd: paths.state,
			accessPropertiesByDotNotation: false,
			configFileMode: 0o600,
			defaults: { version: 1, operations: [] },
		}),
		manifest: new Store<WikiPageManifest>({
			name: 'page-manifest',
			cwd: paths.state,
			accessPropertiesByDotNotation: false,
			configFileMode: 0o600,
			defaults: { version: 1, pages: {} },
		}),
		state: new Store<WikiState>({
			name: 'state',
			cwd: paths.state,
			accessPropertiesByDotNotation: false,
			configFileMode: 0o600,
			defaults: { sources: {} },
		}),
	};
	repositories.set(canonicalTarget, repository);
	return repository;
}
