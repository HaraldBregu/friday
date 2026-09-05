import { createHash } from 'node:crypto';
import { lstat, realpath } from 'node:fs/promises';
import { listKnowledgeFiles } from '../list';
import { readFileBounded } from '../../files/read';
import path from 'node:path';
import type { WikiSource } from './types';
import { assertWikiSourceSafe } from '../safety';
import { MAX_WIKI_SOURCE_BYTES } from './wiki_source_limits';

const WIKI_SOURCE_EXTENSIONS = new Set(['.txt', '.md', '.markdown', '.json', '.csv', '.log']);

export async function collectWikiSources(root: string, signal?: AbortSignal): Promise<WikiSource[]> {
	signal?.throwIfAborted();
	const sourceRoot = await realpath(root);
	const entries = await listKnowledgeFiles(sourceRoot, signal);
	const sources: WikiSource[] = [];

	for (const entry of entries.sort()) {
		signal?.throwIfAborted();
		const candidatePath = path.resolve(sourceRoot, entry);
		const candidateStat = await lstat(candidatePath);
		const absolutePath = candidatePath;
		const sourceStat = candidateStat;
		if (!WIKI_SOURCE_EXTENSIONS.has(path.extname(entry).toLowerCase())) continue;
		if (sourceStat.size > MAX_WIKI_SOURCE_BYTES) throw new Error('Refusing to ingest oversized source: ' + entry);
		const bytes = await readFileBounded(absolutePath, MAX_WIKI_SOURCE_BYTES, signal);
		if (bytes.length > MAX_WIKI_SOURCE_BYTES) {
			throw new Error(
				`Refusing to ingest oversized source (${bytes.length} bytes; maximum ${MAX_WIKI_SOURCE_BYTES}): ${entry}`
			);
		}
		const content = bytes.toString('utf8');
		const relativePath = entry.split(path.sep).join('/');
		assertWikiSourceSafe({ relativePath, content });
		const extension = path.extname(entry).toLowerCase();
		sources.push({
			absolutePath,
			relativePath,
			content,
			hash: createHash('sha256').update(bytes).digest('hex'),
			mediaType:
				extension === '.md' || extension === '.markdown'
					? 'text/markdown'
					: extension === '.json'
						? 'application/json'
						: extension === '.csv'
							? 'text/csv'
							: 'text/plain',
			createdAt: (sourceStat.birthtimeMs > 0
				? sourceStat.birthtime
				: sourceStat.mtime
			).toISOString(),
		});
	}

	return sources;
}
