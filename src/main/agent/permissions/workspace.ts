import { realPath } from '../../shared/real_path';
import { agentLocation } from '../../shared/agent_location';
import type { ToolCapability } from '../execution/capability';
import type { ToolPermissionResolution } from './permission_resolution';
import { isPathWithin } from './permissions_path';

export function isWorkspaceOperation(resolution: ToolPermissionResolution, capability?: ToolCapability): boolean {
	const workspace = realPath(agentLocation());
	return resolution.mode === 'allow' &&
		resolution.targets.length > 0 &&
		resolution.targets.every((target) => isPathWithin(workspace, realPath(target))) &&
		capability !== undefined &&
		capability.effects.every((effect) => ['read', 'write', 'execute', 'persistence'].includes(effect));
}
