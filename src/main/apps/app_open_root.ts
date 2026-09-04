import fs from 'node:fs';
import { shell } from 'electron';
import { extensionsRoot } from './extension_root';

export async function openRoot(): Promise<void> {
	const root = extensionsRoot();
	fs.mkdirSync(root, { recursive: true });
	const error = await shell.openPath(root);
	if (error) throw new Error(error);
}
