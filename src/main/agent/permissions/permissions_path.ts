import path from 'node:path';

export function isPathWithin(parent: string, child: string): boolean {
	const rel = path.relative(parent, child);
	return rel === '' || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
}
