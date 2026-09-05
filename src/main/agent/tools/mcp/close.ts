import { close, type McpClient } from '../../../mcp';

export async function closeMcpClients(clients: Set<McpClient>): Promise<void> {
	const owned = [...clients];
	clients.clear();
	await Promise.allSettled(owned.map((client) => close(client)));
}
