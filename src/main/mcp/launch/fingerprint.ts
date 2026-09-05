import { createHash } from 'node:crypto';
import path from 'node:path';
import { getDefaultEnvironment } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { McpStdioData } from '../../../shared/mcp_types';

export function launchFingerprint(data: McpStdioData): string {
	const environment = { ...getDefaultEnvironment(), ...data.env };
	return createHash('sha256')
		.update(
			JSON.stringify({
				command: data.command,
				enabled: data.enabled !== false,
				approval: data.require_approval ?? 'default',
				args: data.args ?? [],
				env: Object.fromEntries(
					Object.entries(environment).sort(([left], [right]) => left.localeCompare(right))
				),
				cwd: path.resolve(data.cwd ?? process.cwd()),
			})
		)
		.digest('hex');
}
