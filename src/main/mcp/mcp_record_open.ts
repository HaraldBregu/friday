import { safeStorage } from 'electron';
import { MCP_SECRET_KEYS, type McpSecrets } from './mcp_secret_keys';
import type { McpRecord, McpStoredRecord } from './mcp_types';
import { isSafeStorageAvailable } from '../shared/safe_storage';

export function openMcpRecord(
	record: McpStoredRecord,
	volatileSecrets: McpSecrets = {}
): { record: McpRecord; hasPlaintextSecrets: boolean } {
	const data = { ...record } as Record<string, unknown>;
	const secrets: McpSecrets = { ...volatileSecrets };
	let hasPlaintextSecrets = false;
	for (const key of MCP_SECRET_KEYS) {
		if (data[key] !== undefined) {
			secrets[key] = data[key];
			hasPlaintextSecrets = true;
		}
		delete data[key];
	}
	if (typeof data.encryptedSecrets === 'string' && isSafeStorageAvailable()) {
		try {
			const decrypted = JSON.parse(
				safeStorage.decryptString(Buffer.from(data.encryptedSecrets, 'base64'))
			) as Record<string, unknown>;
			for (const key of MCP_SECRET_KEYS) {
				if (decrypted[key] !== undefined) secrets[key] = decrypted[key];
			}
		} catch {
			// Unreadable credentials remain unavailable rather than being exposed or persisted in plaintext.
		}
	}
	delete data.encryptedSecrets;
	return { record: { ...data, ...secrets } as McpRecord, hasPlaintextSecrets };
}
