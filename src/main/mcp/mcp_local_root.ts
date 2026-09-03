import path from 'node:path';
import { userDataLocation } from '../shared/user_data_location';

export function mcpLocalRoot(location = userDataLocation()): string {
	return path.resolve(location, 'mcp', 'servers');
}

export function mcpLocalDiscoveryRoots(location = userDataLocation()): readonly string[] {
	const localRoot = mcpLocalRoot(location);
	const workspaceRoot = path.resolve(process.cwd(), 'resources', 'mcp');
	return localRoot === workspaceRoot ? [localRoot] : [localRoot, workspaceRoot];
}
