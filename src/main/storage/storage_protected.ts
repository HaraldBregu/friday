import path from 'node:path';
import { userDataLocation } from '../shared/user_data_location';

export function isProtectedStoragePath(value: string): boolean {
	const resolved = path.resolve(value);
	const root = path.resolve(userDataLocation());
	const providerCatalog = path.join(root, 'providers');
	return (
		resolved === path.join(root, 'settings', 'providers.json') ||
		resolved === path.join(root, 'settings', 'provider-vault.json') ||
		resolved === providerCatalog ||
		resolved.startsWith(`${providerCatalog}${path.sep}`)
	);
}
