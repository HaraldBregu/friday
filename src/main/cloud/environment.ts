import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function loadLocalEnvironment(appPath: string, packaged: boolean): void {
	if (packaged) return;
	const envPath = path.resolve(appPath, '.env');
	if (!existsSync(envPath)) return;
	for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const separatorIndex = trimmed.indexOf('=');
		if (separatorIndex <= 0) continue;
		const key = trimmed.slice(0, separatorIndex).trim();
		const rawValue = trimmed.slice(separatorIndex + 1).trim();
		if (!key || process.env[key]?.trim()) continue;
		process.env[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
	}
}
