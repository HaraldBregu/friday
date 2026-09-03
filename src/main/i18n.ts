import path from 'node:path';
import { readFileSync } from 'node:fs';
import { app } from 'electron';

export type Translations = Record<string, string>;

export function loadTranslations(lng: string, component: string): Translations {
	const resourceRoot = app.isPackaged ? process.resourcesPath : app.getAppPath();
	const filePath = path.join(resourceRoot, `resources/i18n/${lng}/${component}.json`);
	return JSON.parse(readFileSync(filePath, 'utf-8'));
}
