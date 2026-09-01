import { promises as fs } from 'node:fs';
import path from 'node:path';
import { isProtectedStoragePath } from './storage_protected';

export async function walkFiles(dir: string): Promise<string[]> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map((entry) => {
			const full = path.join(dir, entry.name);
			if (isProtectedStoragePath(full)) return Promise.resolve([]);
			if (entry.isSymbolicLink()) return Promise.resolve([]);
			if (entry.isDirectory()) return walkFiles(full);
			return Promise.resolve(entry.isFile() ? [full] : []);
		})
	);
	return nested.flat();
}
