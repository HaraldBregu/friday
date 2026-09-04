import { rmSync } from 'node:fs';
import path from 'node:path';
import { isAppId } from './app_id';
import { appsRoot } from './app_root';

export function deleteApp(id: string, appLocation?: string): void {
	const root = path.resolve(appsRoot(appLocation));
	const target = path.resolve(root, id);
	if (!isAppId(id) || path.dirname(target) !== root) {
		throw new Error('Invalid app ID.');
	}
	rmSync(target, { recursive: true, force: true });
}
