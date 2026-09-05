import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { knowledgeRoot } from './root';
import { validateFilePath } from '../files/validate';

export async function createKnowledgeDirectory(directory: string): Promise<string> {
	let existing = path.resolve(directory);
	const missing: string[] = [];
	let canonical: string;
	while (true) {
		try { canonical = knowledgeRoot(existing); break; }
		catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || existing === path.dirname(existing)) throw error;
			missing.unshift(path.basename(existing));
			existing = path.dirname(existing);
		}
	}
	for (const component of missing) {
		const identity = JSON.stringify(validateFilePath(canonical));
		const next = path.join(canonical, component);
		await mkdir(next, { mode: 0o700 }).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'EEXIST') throw error; });
		if (JSON.stringify(validateFilePath(canonical)) !== identity) throw new Error('Knowledge directory changed while creating it.');
		canonical = knowledgeRoot(next);
	}
	return canonical;
}
