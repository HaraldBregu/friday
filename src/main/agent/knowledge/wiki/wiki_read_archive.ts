import { createHash } from 'node:crypto';
import { readFileBounded } from '../../files/read';
import { MAX_WIKI_SOURCE_BYTES } from './wiki_source_limits';
import type { WikiSourceRecord } from './types';

export async function readWikiArchive(
	record: WikiSourceRecord,
	signal?: AbortSignal
): Promise<string> {
	signal?.throwIfAborted();
	const bytes = await readFileBounded(record.archivePath, MAX_WIKI_SOURCE_BYTES, signal);
	const checksum = createHash('sha256').update(bytes).digest('hex');
	if (checksum !== record.checksum) {
		throw new Error(`Immutable source archive checksum mismatch: ${record.sourceId}`);
	}
	return bytes.toString('utf8');
}
