import { chmodSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { userDataLocation } from '../../../shared/user_data_location';

export function wikiLocation(): string {
	const location = path.resolve(userDataLocation(), 'wiki');
	mkdirSync(location, { recursive: true, mode: 0o700 });
	chmodSync(location, 0o700);
	return location;
}
