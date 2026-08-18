import fs from 'node:fs/promises';
import path from 'node:path';
import type { WorkspaceTreeEntry } from '../../shared/agent_types';

export async function readWorkspaceTree(
	root: string,
	directory = root
): Promise<WorkspaceTreeEntry[]> {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const result: WorkspaceTreeEntry[] = [];

	for (const entry of entries) {
		const absolutePath = path.join(directory, entry.name);
		const relativePath = path.relative(root, absolutePath) || entry.name;
		if (entry.isDirectory()) {
			result.push({
				name: entry.name,
				path: relativePath,
				type: 'directory',
				children: await readWorkspaceTree(root, absolutePath),
			});
			continue;
		}
		if (entry.isFile()) {
			const stats = await fs.stat(absolutePath);
			result.push({
				name: entry.name,
				path: relativePath,
				type: 'file',
				size: stats.size,
				createdAt: (stats.birthtimeMs > 0 ? stats.birthtime : stats.mtime).toISOString(),
				updatedAt: stats.mtime.toISOString(),
			});
		}
	}

	return result.sort((left, right) => {
		if (left.type !== right.type) return left.type === 'directory' ? -1 : 1;
		return left.name.localeCompare(right.name);
	});
}
