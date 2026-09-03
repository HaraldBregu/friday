import { expect, test, type ElectronApplication, type Page } from '@playwright/test';
import { closeApp } from './close';
import { launchApp } from './helpers';

let app: ElectronApplication;
let page: Page;
let userDataDir: string;

test.beforeAll(async () => {
	({ app, page, userDataDir } = await launchApp());
});

test.afterAll(async () => {
	await closeApp(app, userDataDir);
});

test('opens a window and renders the React app', async () => {
	await expect(page).toHaveTitle('Kucedr');
	await expect(page).toHaveURL(/#\/?start$/);
	await page.waitForSelector('#root');
	await expect(page.locator('#root')).not.toBeEmpty();
});
