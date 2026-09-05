import { readKnowledgeText } from '../read';
import { listKnowledgeFiles } from '../list';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import type { WikiClaim } from './types';

export async function markStaleWikiClaims(
	targetPath: string,
	replacedSourceIds: string[],
	signal?: AbortSignal
): Promise<number> {
	if (replacedSourceIds.length === 0) return 0;
	const replaced = new Set(replacedSourceIds);
	const entries = await listKnowledgeFiles(targetPath, signal);
	let changed = 0;
	for (const entry of entries) {
		signal?.throwIfAborted();
		const relativePath = entry.split(path.sep).join('/');
		if (path.posix.extname(relativePath).toLowerCase() !== '.md') continue;
		const pagePath = path.resolve(targetPath, entry);
		const parsed = matter(await readKnowledgeText(targetPath, entry, signal));
		if (!Array.isArray(parsed.data.claims)) continue;
		let content = parsed.content;
		let pageChanged = false;
		const claims = (parsed.data.claims as WikiClaim[]).map((claim) => {
			const staleCount = claim.evidence.filter((item) => replaced.has(item.sourceId)).length;
			if (staleCount === 0) return claim;
			const status = staleCount === claim.evidence.length ? 'superseded' : 'disputed';
			if (claim.status === status) return claim;
			const heading = `### ${claim.statement}`;
			const start = content.indexOf(heading);
			if (start >= 0) {
				const end = content.indexOf('\n### ', start + heading.length);
				const blockEnd = end < 0 ? content.length : end;
				const block = content.slice(start, blockEnd).replace(/\*\*Status:\*\* [^\n]+/, `**Status:** ${status}`);
				content = `${content.slice(0, start)}${block}${content.slice(blockEnd)}`;
			}
			pageChanged = true;
			return { ...claim, status };
		});
		if (!pageChanged) continue;
		await writeFile(pagePath, matter.stringify(content, { ...parsed.data, claims }), {
			encoding: 'utf8',
			signal,
		});
		changed += 1;
	}
	return changed;
}
