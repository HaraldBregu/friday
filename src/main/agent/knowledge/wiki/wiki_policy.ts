import { readKnowledgeText } from '../read';
import { getWikiSettings } from './wiki_get_settings';
import { wikiPaths } from './wiki_paths';

export async function loadWikiPolicy(
	operation: 'ingest' | 'save_analysis' | 'lint' | 'review'
): Promise<string> {
	const paths = wikiPaths(getWikiSettings().targetPath);
	const schema = await readKnowledgeText(paths.config, 'schema.yaml', undefined, true, 12_000);
	const operationPolicy =
		operation === 'review'
			? await readKnowledgeText(paths.config, 'review-policy.yaml', undefined, true, 12_000)
			: await readKnowledgeText(paths.config, 'page-types.yaml', undefined, true, 12_000);
	return [schema, operationPolicy].filter(Boolean).join('\n\n').slice(0, 12_000);
}
