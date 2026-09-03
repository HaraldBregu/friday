import fs from 'node:fs/promises';
import path from 'node:path';

import { resolveWorkspaceFile } from './workspace';

export async function deleteWorkspaceDirectory(root: string, directoryPath: string): Promise<void> {
	const resolvedRoot = await fs.realpath(root);
	const resolvedPath = await resolveWorkspaceFile(root, directoryPath);
	if (path.resolve(resolvedRoot, directoryPath) !== resolvedPath) {
		throw new Error('Workspace symlinks cannot be deleted.');
	}
	if (resolvedPath === resolvedRoot) throw new Error('The workspace root cannot be deleted.');
	const stats = await fs.stat(resolvedPath);
	if (!stats.isDirectory()) throw new Error('Workspace path is not a folder.');
	await fs.rm(resolvedPath, { recursive: true });
}
