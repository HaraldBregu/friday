import { readKnowledgeText } from '../read';
import { getWikiSettings } from './wiki_get_settings';
import { getWikiRepository } from './wiki_repository';

export async function getRecentWikiActivity(
	count = 10,
	targetPath = getWikiSettings().targetPath
): Promise<string> {
	const repository = getWikiRepository(targetPath);
	const limit = Math.max(1, Math.min(50, Math.trunc(count)));
	const log = await readKnowledgeText(targetPath, 'log.md', undefined, true);
	const entries = log
		.split(/(?=^## \[\d{4}-\d{2}-\d{2}\])/m)
		.filter((entry) => entry.trim())
		.slice(-limit);
	const pending = repository.reviews.store.items
		.filter((item) => item.status === 'pending')
		.map((item) => `- ${item.id}: ${item.reason} (${item.affectedPages.join(', ')})`)
		.join('\n');
	return `${entries.join('\n').trim() || '_No wiki activity recorded._'}\n\n## Pending review\n\n${pending || '_No pending review items._'}\n`;
}
