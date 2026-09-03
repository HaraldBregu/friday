import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import path from 'node:path';
import type { McpLocalImportResult } from '../../shared/mcp_types';
import { readLocalMcpServer } from './mcp_local_read';
import { mcpLocalRoot } from './mcp_local_root';
import { localMcpIdentity } from './mcp_local_identity';
import { setLocalMcpEnvironment } from './mcp_store_state';

export function importLocalMcpServers(
	sources: readonly string[],
	root = mcpLocalRoot()
): McpLocalImportResult {
	mkdirSync(root, { recursive: true });
	const imported: McpLocalImportResult['imported'][number][] = [];
	const skipped: McpLocalImportResult['skipped'][number][] = [];
	for (const source of sources) {
		let temporary: string | undefined;
		let destination: string | undefined;
		try {
			const server = readLocalMcpServer(source);
			if (server.data.type !== 'stdio') throw new Error('Expected a local MCP server.');
			const target = path.join(root, server.id);
			if (existsSync(target)) {
				throw new Error(`A local MCP server with ID "${server.id}" already exists.`);
			}
			destination = target;
			temporary = mkdtempSync(path.join(root, '.import-'));
			cpSync(source, temporary, { recursive: true, force: false, errorOnExist: true });
			const manifestPath = path.join(temporary, 'mcp.json');
			const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
			writeFileSync(
				manifestPath,
				`${JSON.stringify(
					{ ...manifest, env: undefined, require_approval: 'always', enabled: false },
					null,
					'\t'
				)}\n`,
				'utf8'
			);
			renameSync(temporary, destination);
			temporary = undefined;
			const installed = readLocalMcpServer(destination);
			if (installed.data.type !== 'stdio') throw new Error('Expected a local MCP server.');
			setLocalMcpEnvironment(server.id, localMcpIdentity(installed.data), server.data.env);
			imported.push(readLocalMcpServer(destination));
			destination = undefined;
		} catch (error) {
			if (temporary) rmSync(temporary, { recursive: true, force: true });
			if (destination && existsSync(destination)) {
				rmSync(destination, { recursive: true, force: true });
			}
			skipped.push({
				name: path.basename(source),
				path: source,
				reason: error instanceof Error ? error.message : String(error),
			});
		}
	}
	return { imported, skipped };
}
