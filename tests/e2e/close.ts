import type { ElectronApplication } from '@playwright/test';
import { rm } from 'node:fs/promises';

export async function closeApp(
	app: ElectronApplication | undefined,
	userDataDir: string | undefined
): Promise<void> {
	await app?.close();
	if (userDataDir) await rm(userDataDir, { recursive: true, force: true });
}
