import { realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateFilePath } from '../files/validate';

const systemTemporaryRoots = [...new Set([tmpdir(), '/tmp'])].map((root) => ({ root: path.resolve(root), canonical: realpathSync(root) }));

export function knowledgeRoot(root: string): string {
	let absolute = path.resolve(root);
	for (const temporary of systemTemporaryRoots) {
		const relative = path.relative(temporary.root, absolute);
		if (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..' + path.sep)) {
			absolute = path.resolve(temporary.canonical, relative);
			break;
		}
	}
	validateFilePath(absolute);
	return absolute;
}
