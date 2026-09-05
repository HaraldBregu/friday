import { constants } from 'node:fs';
import { mkdir, open, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { knowledgeRoot } from './root';
import { validateFilePath } from '../files/validate';
import { KNOWLEDGE_MAX_FILE_BYTES } from './limits';

export async function writeKnowledgeText(root: string, relativePath: string, content: string, signal?: AbortSignal): Promise<void> {
	signal?.throwIfAborted();
	if (Buffer.byteLength(content) > KNOWLEDGE_MAX_FILE_BYTES) throw new Error('Knowledge output exceeds its byte limit.');
	await mkdir(root, { recursive: true, mode: 0o700 });
	const canonicalRoot = knowledgeRoot(root);
	const file = path.resolve(canonicalRoot, relativePath);
	const relative = path.relative(canonicalRoot, file);
	if (!relative || path.isAbsolute(relative) || relative === '..' || relative.startsWith('..' + path.sep)) throw new Error('Knowledge output escapes its root.');
	await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
	const identity = JSON.stringify(validateFilePath(file, true));
	const temporary = path.join(path.dirname(file), '.' + path.basename(file) + '.' + randomUUID() + '.tmp');
	const handle = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
	try {
		await handle.writeFile(content, { encoding: 'utf8', signal });
		signal?.throwIfAborted();
		if (JSON.stringify(validateFilePath(file, true)) !== identity) throw new Error('Knowledge output path changed while writing.');
		await rename(temporary, file);
	} finally {
		await handle.close();
		await rm(temporary, { force: true });
	}
}
