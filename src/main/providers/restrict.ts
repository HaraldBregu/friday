import { chmodSync } from 'node:fs';

export function restrictProviderPermissions(directory: string, file: string): void {
	try {
		chmodSync(directory, 0o700);
		chmodSync(file, 0o600);
	} catch {
		return;
	}
}
