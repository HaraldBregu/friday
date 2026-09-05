import { lstat, opendir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { validateFilePath } from '../files/validate';
import { KNOWLEDGE_MAX_DEPTH, KNOWLEDGE_MAX_ENTRIES, KNOWLEDGE_MAX_FILES, KNOWLEDGE_MAX_TOTAL_BYTES } from './limits';

export async function listKnowledgeFiles(root: string, signal?: AbortSignal): Promise<string[]> {
	signal?.throwIfAborted();
	let canonicalRoot: string;
	try { canonicalRoot = await realpath(root); }
	catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw error;
	}
	const pending = [{ relative: '', depth: 0 }];
	const files: string[] = [];
	let entries = 0;
	let bytes = 0;
	while (pending.length > 0) {
		signal?.throwIfAborted();
		const current = pending.pop()!;
		if (current.depth > KNOWLEDGE_MAX_DEPTH) throw new Error('Knowledge folder exceeds the depth limit.');
		const directory = path.join(canonicalRoot, current.relative);
		const identity = JSON.stringify(validateFilePath(directory));
		const handle = await opendir(directory);
		for await (const entry of handle) {
			signal?.throwIfAborted();
			if (++entries > KNOWLEDGE_MAX_ENTRIES) throw new Error('Knowledge folder exceeds the entry limit.');
			const relative = path.join(current.relative, entry.name);
			const file = path.join(canonicalRoot, relative);
			const stat = await lstat(file);
			if (stat.isSymbolicLink()) throw new Error('Refusing knowledge source symlink: ' + relative);
			if (stat.isDirectory()) pending.push({ relative, depth: current.depth + 1 });
			else if (stat.isFile()) {
				files.push(relative);
				bytes += stat.size;
				if (files.length > KNOWLEDGE_MAX_FILES || bytes > KNOWLEDGE_MAX_TOTAL_BYTES)
					throw new Error('Knowledge folder exceeds the file or corpus byte limit.');
			}
			if (JSON.stringify(validateFilePath(directory)) !== identity)
				throw new Error('Knowledge directory changed while listing.');
		}
	}
	return files.sort();
}
