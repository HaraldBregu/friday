import fs from 'node:fs/promises';

import { workspaceFileType } from '../../shared/workspace';
import { atomicWrite } from '../shared/atomic_write';
import { resolveWorkspaceFile } from './workspace';

export async function writeWorkspaceMarkdown(
	root: string,
	filePath: string,
	content: string
): Promise<void> {
	const resolvedPath = await resolveWorkspaceFile(root, filePath);
	const stats = await fs.stat(resolvedPath);
	if (!stats.isFile()) throw new Error('Workspace path is not a file.');
	if (workspaceFileType(resolvedPath).kind !== 'markdown') {
		throw new Error('Only Markdown workspace files can be edited.');
	}
	await atomicWrite(resolvedPath, content);
}
