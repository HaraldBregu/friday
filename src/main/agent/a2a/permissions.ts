import { chmodSync } from 'node:fs';
import path from 'node:path';

export function restrictA2aStorePermissions(storePath: string): void {
	try {
		chmodSync(path.dirname(storePath), 0o700);
		chmodSync(storePath, 0o600);
	} catch {}
}
