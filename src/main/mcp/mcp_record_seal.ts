import { safeStorage } from 'electron';
import { MCP_SECRET_KEYS, type McpSecrets } from './mcp_secret_keys';
import type { McpRecord, McpStoredRecord } from './mcp_types';
import { isSafeStorageAvailable } from '../shared/safe_storage';

export function sealMcpRecord(record: McpRecord): {
	record: McpStoredRecord;
	volatileSecrets?: McpSecrets;
} {
	const stored = { ...record } as Record<string, unknown>;
	const secrets: McpSecrets = {};
	for (const key of MCP_SECRET_KEYS) {
		if (stored[key] !== undefined) secrets[key] = stored[key];
		delete stored[key];
	}
	if (Object.keys(secrets).length === 0) return { record: stored as McpStoredRecord };
	if (!isSafeStorageAvailable()) {
		return { record: stored as McpStoredRecord, volatileSecrets: secrets };
	}
	stored.encryptedSecrets = safeStorage.encryptString(JSON.stringify(secrets)).toString('base64');
	return { record: stored as McpStoredRecord };
}
