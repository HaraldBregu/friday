import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { appManifestPath } from './app_manifest';
import { appsRoot } from './app_root';
import { isAppManifest } from './app_manifest_validate';
import { isAppEntry } from './app_entry_validate';
import type { AppManifest } from './app_types';

function cleanAppEntry(value: string): string {
	const trimmed = value.trim().replace(/\\+/g, '/').replace(/^\.?\//, '').replace(/\/+$/g, '');
	return trimmed;
}

function extractEntryFromExports(value: unknown): string | null {
	if (typeof value === 'string') {
		const normalized = cleanAppEntry(value);
		return isAppEntry(normalized) ? normalized : null;
	}

	if (!value || typeof value !== 'object') return null;
	const record = value as Record<string, unknown>;
	const candidates = ['import', 'module', 'require', 'browser', 'default', 'node', 'development', 'production'];

	for (const candidate of candidates) {
		const entry = extractEntryFromExports(record[candidate]);
		if (entry) return entry;
	}

	for (const candidate of Object.keys(record)) {
		const entry = extractEntryFromExports(record[candidate]);
		if (entry) return entry;
	}

	return null;
}

function readPackageManifestFromStandardFields(directory: string): AppManifest | null {
	const file = path.join(directory, 'package.json');
	if (!existsSync(file)) return null;

	try {
		const packageJson = JSON.parse(readFileSync(file, 'utf8')) as {
			name?: string;
			version?: string;
			description?: string;
			keywords?: Array<string> | null;
			main?: unknown;
			exports?: unknown;
		};

		const title = typeof packageJson.name === 'string' ? packageJson.name.trim() : '';
		const description = typeof packageJson.description === 'string' ? packageJson.description.trim() : '';
		const version = typeof packageJson.version === 'string' ? packageJson.version.trim() : '';
		if (!title || !description || !version) return null;

		const category =
			Array.isArray(packageJson.keywords) && packageJson.keywords.length > 0 && packageJson.keywords[0].trim()
				? packageJson.keywords[0].trim()
				: 'utility';

		const main =
			typeof packageJson.main === 'string' ? cleanAppEntry(packageJson.main) : null;
		const fromExports = extractEntryFromExports(packageJson.exports);
		const entry = main && isAppEntry(main) ? main : fromExports;
		if (!entry) return null;

		const candidate: AppManifest = {
			title,
			description,
			metadata: {
				version,
				category,
				entry,
			},
		};

		return isAppManifest(candidate) ? candidate : null;
	} catch {
		return null;
	}
}

export function readAppManifest(id: string, appLocation?: string): AppManifest | null {
	const file = appManifestPath(id, appLocation);
	if (existsSync(file)) {
		try {
			const manifest = JSON.parse(readFileSync(file, 'utf8')) as unknown;
			return isAppManifest(manifest) ? manifest : null;
		} catch {
			return null;
		}
	}

	return readPackageManifestFromStandardFields(path.join(appsRoot(appLocation), id));
}

export function readAppManifestFromDirectory(directory: string): AppManifest | null {
	const file = path.join(directory, 'manifest.json');
	if (existsSync(file)) {
		try {
			const manifest = JSON.parse(readFileSync(file, 'utf8')) as unknown;
			return isAppManifest(manifest) ? manifest : null;
		} catch {
			return null;
		}
	}

	return readPackageManifestFromStandardFields(directory);
}
