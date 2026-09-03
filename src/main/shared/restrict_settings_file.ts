import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export function restrictSettingsFile(file: string): void {
	try {
		const directory = path.dirname(file);
		mkdirSync(directory, { recursive: true, mode: 0o700 });
		chmodSync(directory, 0o700);
		if (existsSync(file)) chmodSync(file, 0o600);
	} catch {
		return;
	}
}
