import { readKnowledgeText } from '../read';
import { listKnowledgeFiles } from '../list';
import path from 'node:path';
import matter from 'gray-matter';
import { writeKnowledgeText } from '../write';

export async function rebuildWikiIndex(targetPath: string): Promise<void> {
	const entries = await listKnowledgeFiles(targetPath);
	const pages: Array<{
		category: string;
		link: string;
		title: string;
		summary: string;
		updated: string;
		sourceCount: number;
		confidence: string;
	}> = [];

	for (const entry of entries) {
		const relativePath = entry.split(path.sep).join('/');
		if (path.posix.extname(relativePath).toLowerCase() !== '.md') continue;
		if (['index.md', 'log.md', 'AGENTS.md'].includes(relativePath)) continue;
		const parsed = matter(await readKnowledgeText(targetPath, entry));
		const sources = Array.isArray(parsed.data.sources) ? parsed.data.sources : [];
		pages.push({
			category:
				path.posix.dirname(relativePath) === '.' ? 'General' : path.posix.dirname(relativePath),
			link: relativePath.slice(0, -3),
			title: String(parsed.data.title ?? path.posix.basename(relativePath, '.md')),
			summary: String(parsed.data.summary ?? '').trim(),
			updated: String(parsed.data.updated ?? '').slice(0, 10),
			sourceCount: sources.length,
			confidence: String(parsed.data.confidence ?? ''),
		});
	}

	const sections = [...new Set(pages.map((page) => page.category))]
		.sort()
		.map((category) => {
			const rows = pages
				.filter((page) => page.category === category)
				.sort((left, right) => left.title.localeCompare(right.title))
				.map(
					(page) =>
						`- [[${page.link}|${page.title}]] — ${page.summary}${page.updated ? ` (${page.updated}` : ''}${page.updated && page.sourceCount ? `, ${page.sourceCount} source${page.sourceCount === 1 ? '' : 's'}` : ''}${page.updated && page.confidence ? `, ${page.confidence} confidence` : ''}${page.updated ? ')' : ''}`
				)
				.join('\n');
			return `## ${category}\n\n${rows}`;
		})
		.join('\n\n');
	const markdown = `# Wiki index\n\n${sections || '_No pages have been generated yet._'}\n`;
	await writeKnowledgeText(targetPath, 'index.md', markdown);
}
