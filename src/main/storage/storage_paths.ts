import path from 'node:path';
import { isProtectedStoragePath } from './storage_protected';

export function normalizeStoragePaths(value: unknown): string[] {
	if (!Array.isArray(value) || value.length > 32) throw new Error('Invalid storage folders.');
	const normalized = value.map((entry) => {
		if (typeof entry !== 'string' || !path.isAbsolute(entry) || entry.length > 4096) {
			throw new Error('Storage folders must use absolute paths.');
		}
		const resolved = path.resolve(entry);
		if (resolved === path.parse(resolved).root) {
			throw new Error('A filesystem root cannot be synchronized.');
		}
		if (isProtectedStoragePath(resolved)) {
			throw new Error('Provider credential data cannot be synchronized as a file.');
		}
		return resolved;
	});
	return [...new Set(normalized)];
}
