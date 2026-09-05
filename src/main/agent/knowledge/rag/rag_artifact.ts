import { readFileBoundedSync } from '../../files/read_sync';
import { knowledgeRoot } from '../root';
import path from 'node:path';
import { ragLocation } from './rag_location';
import type { RagArtifact } from './types';

export function readRagArtifact(fileName: string): RagArtifact | undefined {
	if (path.basename(fileName) !== fileName || !/^embeddings-kucedr-[a-f0-9-]+\.json$/.test(fileName)) {
		return undefined;
	}
	try {
		const artifact = JSON.parse(readFileBoundedSync(path.join(knowledgeRoot(ragLocation()), fileName), 100 * 1024 * 1024).content.toString('utf8')) as RagArtifact;
		return Array.isArray(artifact.records) ? artifact : undefined;
	} catch {
		return undefined;
	}
}
