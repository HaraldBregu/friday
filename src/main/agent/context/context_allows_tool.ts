import { fileToolState } from './context_file_tool_state';
import { hasCreatedFile } from './context_has_created_file';
import { hasToolPermission } from './context_has_tool_permission';
import type { FileAccessContext } from './context_types';

export function contextAllowsTool(
	context: FileAccessContext | undefined,
	toolName: string,
	args: Record<string, unknown>,
	baseDir: string
): boolean {
	const state = fileToolState(toolName, args, baseDir);
	if (!state) return false;
	if (toolName === 'edit') return hasCreatedFile(context, state.path);
	return toolName === 'read' && hasToolPermission(context, state.directory);
}
