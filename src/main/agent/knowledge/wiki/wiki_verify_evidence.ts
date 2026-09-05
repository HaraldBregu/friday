import { createHash } from 'node:crypto';
import type { WikiRepository } from './types';
import { readWikiArchive } from './wiki_read_archive';
import type { WikiEvidence } from './types';

export async function verifyWikiEvidence(
	evidence: WikiEvidence,
	repository: WikiRepository,
	signal?: AbortSignal
): Promise<WikiEvidence> {
	signal?.throwIfAborted();
	const record = repository.sources.store.sources[evidence.sourceId];
	if (!record) throw new Error(`Wiki evidence source not found: ${evidence.sourceId}`);
	const content = await readWikiArchive(record, signal, repository.paths.evidence);
	const lineMatch = /^lines?\s+(\d+)(?:-(\d+))?$/i.exec(evidence.locator.trim());
	let excerpt: string;
	let locator = evidence.locator.trim();
	if (lineMatch) {
		const start = Number(lineMatch[1]);
		const end = Number(lineMatch[2] ?? lineMatch[1]);
		const lines = content.split(/\r?\n/);
		if (start < 1 || end < start || end > lines.length) {
			throw new Error(`Wiki evidence locator is outside the archived source: ${locator}`);
		}
		excerpt = lines.slice(start - 1, end).join('\n');
		locator = `lines ${start}-${end}`;
	} else {
		const index = content.indexOf(locator);
		if (index < 0) {
			throw new Error(`Wiki evidence locator was not found in the archived source: ${locator}`);
		}
		excerpt = locator;
	}
	if (!excerpt.trim())
		throw new Error(`Wiki evidence locator resolved to an empty excerpt: ${locator}`);
	const excerptHash = createHash('sha256').update(excerpt, 'utf8').digest('hex');
	if (evidence.excerptHash && evidence.excerptHash !== excerptHash) {
		throw new Error(`Wiki evidence excerpt hash mismatch: ${evidence.sourceId}:${locator}`);
	}
	return { ...evidence, locator, excerptHash };
}
