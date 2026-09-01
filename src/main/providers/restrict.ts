import { chmodSync } from 'node:fs';

export function restrictProviderPermissions(directory: string, file: string): void {
	if (process.platform === 'win32') return;
	chmodSync(directory, 0o700);
	chmodSync(file, 0o600);
}
