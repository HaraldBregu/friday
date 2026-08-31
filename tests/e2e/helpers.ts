import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const MAIN_ENTRY = path.resolve(dirname, '../../out/main/index.js');

/**
 * Launch the built Electron app and return the app handle plus its first window.
 * Requires a prior `npm run build` so that out/main, out/preload and out/renderer exist.
 */
export async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
	const app = await electron.launch({
		args: [
			MAIN_ENTRY,
			`--user-data-dir=${path.join(os.tmpdir(), `friday-e2e-${process.pid}`)}`,
		],
		// ponytail: force production renderer (loadFile) even if a dev URL leaked into env
		env: { ...process.env, NODE_ENV: 'production', ELECTRON_RENDERER_URL: '' },
	});
	const page = await app.firstWindow();
	await page.waitForLoadState('domcontentloaded');
	return { app, page };
}
