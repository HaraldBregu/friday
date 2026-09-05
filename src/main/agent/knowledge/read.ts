import { knowledgeRoot } from './root';
import path from 'node:path';
import { readFileBounded } from '../files/read';
import { KNOWLEDGE_MAX_FILE_BYTES } from './limits';

export async function readKnowledgeText(
	root: string,
	relativePath: string,
	signal?: AbortSignal,
	optional = false,
	maxBytes = KNOWLEDGE_MAX_FILE_BYTES
): Promise<string> {
	signal?.throwIfAborted();
	try {
		const canonicalRoot = knowledgeRoot(root);
		const file = path.resolve(canonicalRoot, relativePath);
		const relative = path.relative(canonicalRoot, file);
		if (
			!relative ||
			path.isAbsolute(relative) ||
			relative === '..' ||
			relative.startsWith('..' + path.sep)
		)
			throw new Error('Knowledge file escapes its configured root.');
		return (await readFileBounded(file, maxBytes, signal)).toString('utf8');
	} catch (error) {
		if (optional && (error as NodeJS.ErrnoException).code === 'ENOENT') return '';
		throw error;
	}
}
