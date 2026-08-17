import path from 'node:path';
import { directoryPermissionTargets } from './directory_permission_targets';
import { toolPermissionTargets } from './tool_permission_targets';
import type { FileHistory } from '../history/types';

export function toolApprovalTargets(
	toolName: string,
	args: Record<string, unknown>,
	baseDir: string,
	history?: FileHistory
): string[] {
	if (toolName === 'bash' || toolName === 'process') {
		return directoryPermissionTargets(toolName, args, baseDir, history);
	}
	const targets = toolPermissionTargets(toolName, args, baseDir);
	return targets.length > 0
		? targets.map((target) => path.dirname(target))
		: directoryPermissionTargets(toolName, args, baseDir, history);
}
