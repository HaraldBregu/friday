import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { userDataLocation } from '../../../shared/user_data_location';
import type { RagManifest } from './types';

function manifestPath(): string {
	return path.join(userDataLocation(), 'rag', 'index.json');
}

export function readRagManifest(): RagManifest | undefined {
	try {
		return JSON.parse(readFileSync(manifestPath(), 'utf8')) as RagManifest;
	} catch {
		return undefined;
	}
}

export function writeRagManifest(manifest: RagManifest): void {
	const file = manifestPath();
	const temporaryFile = `${file}.${randomUUID()}.tmp`;
	mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
	try {
		writeFileSync(temporaryFile, JSON.stringify(manifest), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
		renameSync(temporaryFile, file);
	} finally {
		rmSync(temporaryFile, { force: true });
	}
}
