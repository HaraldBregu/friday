import { lstatSync } from 'node:fs';
import path from 'node:path';
import type { FileIdentity } from './types';

export function validateFilePath(filePath: string, allowMissing = false): FileIdentity[] {
	const absolute = path.resolve(filePath);
	const root = path.parse(absolute).root;
	const identities: FileIdentity[] = [];
	let current = root;
	for (const component of path.relative(root, absolute).split(path.sep).filter(Boolean)) {
		current = path.join(current, component);
		let stat;
		try {
			stat = lstatSync(current);
		} catch (error) {
			if (allowMissing && current === absolute && (error as NodeJS.ErrnoException).code === 'ENOENT')
				return identities;
			throw error;
		}
		if (stat.isSymbolicLink()) throw new Error(`Symbolic links are not permitted: ${current}`);
		if (current !== absolute && !stat.isDirectory())
			throw new Error(`Expected a directory: ${current}`);
		identities.push({ path: current, dev: stat.dev, ino: stat.ino });
	}
	return identities;
}
