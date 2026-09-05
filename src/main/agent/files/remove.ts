import fs from 'node:fs/promises';
import { authorizeFilePath } from './authorize';
import { validateFilePath } from './validate';

export async function removeAuthorizedFile(filePath: string, signal?: AbortSignal): Promise<void> {
	signal?.throwIfAborted();
	const target = authorizeFilePath(filePath);
	validateFilePath(target);
	await fs.unlink(target);
}
