import { mkdirSync } from 'node:fs';
import { listApps } from './app_list';
import { appsRoot } from './app_root';
import type { App } from './app_types';

export function ensureApps(appLocation?: string): App[] {
	mkdirSync(appsRoot(appLocation), { recursive: true });
	return listApps(appLocation);
}
