import { realPath } from '../../shared/real_path';
import { resolveUserPath } from '../../shared/user_path';
import { registry } from '../tools/core/process';

const PATCH_TARGET = /^[ \t]*[*]{3} (?:Add|Delete|Update) File: (.+?)[ \t]*$/gm;
const PATCH_MOVE = /^[ \t]*[*]{3} Move to: (.+?)[ \t]*$/gm;

function patchTargets(input: string, baseDir: string): string[] {
	const targets: string[] = [];
	for (const match of input.matchAll(PATCH_TARGET))
		targets.push(realPath(resolveUserPath(match[1], baseDir)));
	for (const match of input.matchAll(PATCH_MOVE))
		targets.push(realPath(resolveUserPath(match[1], baseDir)));
	return targets;
}

export function toolPermissionTargets(
	toolName: string,
	args: Record<string, unknown>,
	baseDir: string
): string[] {
	if (toolName === 'patch')
		return typeof args.input === 'string' ? patchTargets(args.input, baseDir) : [];
	if (toolName === 'bash')
		return typeof args.command === 'string' && args.command.length > 0 ? [args.command] : [];
	if (toolName === 'process') {
		const session = typeof args.sessionId === 'string' ? registry.get(args.sessionId) : undefined;
		return session?.executionMode === 'host' ? [JSON.stringify(args)] : [];
	}
	if (typeof args.path === 'string' && args.path.length > 0) {
		const target = realPath(resolveUserPath(args.path, baseDir));
		return [target];
	}
	return [];
}
