import fs from 'node:fs/promises';
import path from 'node:path';

import { resolveWorkspaceFile } from './workspace';

export async function deleteWorkspaceFile(root: string, filePath: string): Promise<void> {
	const resolvedRoot = await fs.realpath(root);
	const resolvedPath = await resolveWorkspaceFile(root, filePath);
	if (path.resolve(resolvedRoot, filePath) !== resolvedPath) {
		throw new Error('Workspace symlinks cannot be deleted.');
	}
	const stats = await fs.stat(resolvedPath);
	if (!stats.isFile()) throw new Error('Workspace path is not a file.');
	await fs.unlink(resolvedPath);
}
