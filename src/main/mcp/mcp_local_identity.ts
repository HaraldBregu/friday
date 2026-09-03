import type { McpStdioData } from '../../shared/mcp_types';

export function localMcpIdentity(data: Pick<McpStdioData, 'command' | 'args' | 'cwd'>): string {
	return JSON.stringify([data.command, data.args ?? [], data.cwd ?? '']);
}
