import path from 'node:path';
import Store from 'electron-store';
import { userDataLocation } from '../shared/user_data_location';
import { openMcpRecord } from './mcp_record_open';
import { sealMcpRecord } from './mcp_record_seal';
import type { McpSecrets } from './mcp_secret_keys';
import type { McpRecord, McpStoreSchema } from './mcp_types';
import { restrictSettingsFile } from '../shared/restrict_settings_file';

type LegacyProvidersState = {
	mcp_servers?: unknown;
};

const settingsDirectory = path.resolve(userDataLocation(), 'settings');

const legacyStore = new Store<LegacyProvidersState>({
	name: 'providers',
	cwd: settingsDirectory,
	accessPropertiesByDotNotation: false,
});

const store = new Store<McpStoreSchema>({
	name: 'mcp',
	cwd: settingsDirectory,
	accessPropertiesByDotNotation: false,
	defaults: { servers: [] },
});

let volatileSecrets = new Map<string, McpSecrets>();

function isMcpRecord(value: unknown): value is McpRecord {
	if (typeof value !== 'object' || value === null) return false;
	const record = value as Record<string, unknown>;
	return typeof record.id === 'string' && typeof record.type === 'string';
}

function isMcpRecordArray(value: unknown): value is McpRecord[] {
	return Array.isArray(value) && value.every(isMcpRecord);
}

function migrateLegacyMcpServers(): void {
	const legacyServers = legacyStore.get('mcp_servers');
	const hasLegacyServers = isMcpRecordArray(legacyServers);
	const migrated = getMcpServersState();
	if (migrated.length === 0 && hasLegacyServers) {
		setMcpServersState(legacyServers);
	}

	if (legacyStore.get('mcp_servers') !== undefined && typeof legacyStore.delete === 'function') {
		legacyStore.delete('mcp_servers');
	}
}

export const mcpStorePath = store.path;
restrictSettingsFile(mcpStorePath);

export function getMcpServersState(): McpRecord[] {
	let hasPlaintextSecrets = false;
	const servers = store.get('servers').map((stored) => {
		const opened = openMcpRecord(stored, volatileSecrets.get(stored.id));
		hasPlaintextSecrets ||= opened.hasPlaintextSecrets;
		return opened.record;
	});
	if (hasPlaintextSecrets) setMcpServersState(servers);
	return servers;
}

export function setMcpServersState(value: McpRecord[]): void {
	const nextVolatileSecrets = new Map<string, McpSecrets>();
	const servers = value.map((record) => {
		const sealed = sealMcpRecord(record);
		if (sealed.volatileSecrets) nextVolatileSecrets.set(record.id, sealed.volatileSecrets);
		return sealed.record;
	});
	volatileSecrets = nextVolatileSecrets;
	store.set('servers', servers);
	restrictSettingsFile(mcpStorePath);
}

export function migrateMcpStoreFromProviders(): void {
	migrateLegacyMcpServers();
}
