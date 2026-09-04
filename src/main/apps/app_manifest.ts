import path from 'node:path';
import { isAppId } from './app_id';
import { appsRoot } from './app_root';

export function appManifestPath(id: string, appLocation?: string): string {
	if (!isAppId(id)) throw new Error(`Invalid app id: ${id}`);
	return path.join(appsRoot(appLocation), id, 'manifest.json');
}
