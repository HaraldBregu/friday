import fs from 'node:fs';
import { shell } from 'electron';
import { appsRoot } from './app_root';

export async function openRoot(): Promise<void> {
	const root = appsRoot();
	fs.mkdirSync(root, { recursive: true });
	const error = await shell.openPath(root);
	if (error) throw new Error(error);
}
