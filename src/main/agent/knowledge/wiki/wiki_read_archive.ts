import { knowledgeRoot } from '../root';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFileBounded } from '../../files/read';
import { MAX_WIKI_SOURCE_BYTES } from './wiki_source_limits';
import type { WikiSourceRecord } from './types';

export async function readWikiArchive(
	record: WikiSourceRecord,
	signal: AbortSignal | undefined,
	evidenceRoot: string
): Promise<string> {
	signal?.throwIfAborted();
	const root = knowledgeRoot(evidenceRoot);
	const relative = path.relative(path.resolve(evidenceRoot), path.resolve(record.archivePath));
	if (path.isAbsolute(relative) || relative === '..' || relative.startsWith('..' + path.sep))
		throw new Error('Archive escapes its repository.');
	const bytes = await readFileBounded(path.join(root, relative), MAX_WIKI_SOURCE_BYTES, signal);
	const checksum = createHash('sha256').update(bytes).digest('hex');
	if (checksum !== record.checksum) {
		throw new Error(`Immutable source archive checksum mismatch: ${record.sourceId}`);
	}
	return bytes.toString('utf8');
}
