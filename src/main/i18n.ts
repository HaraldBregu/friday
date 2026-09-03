import path from 'node:path';
import { readFileSync } from 'node:fs';
import { resourceRoot } from './shared/resource_root';

export type Translations = Record<string, string>;

export function loadTranslations(lng: string, component: string): Translations {
	const filePath = path.join(resourceRoot(), `resources/i18n/${lng}/${component}.json`);
	return JSON.parse(readFileSync(filePath, 'utf-8'));
}
