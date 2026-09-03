import type { McpData } from '../../shared/mcp_types';
import { getMcpServersState, setMcpServersState } from './mcp_store_state';
import { mergeMcpRecord } from './mcp_record_merge';

export function upsertMcpServer(id: string, data: McpData): void {
	const current = getMcpServersState();
	const existing = current.find((server) => server.id === id);
	const next = mergeMcpRecord(id, data, existing);
	setMcpServersState([...current.filter((server) => server.id !== id), next]);
}
