import type { AgentContextMode, AgentInteractionMode } from '../../../shared/agent_types';
import type { SessionCategory } from '../session';
import type { Config } from '../types';
import { readBootstrap } from './system_read_bootstrap';
import { workspacePath } from './system_workspace_path';

export async function resolveContextMode(
	config: Config,
	requestedMode: AgentContextMode,
	category: SessionCategory,
	interactionMode: AgentInteractionMode,
	hasCustomInstructions: boolean
): Promise<AgentContextMode> {
	if (
		requestedMode === 'workspace' ||
		category !== 'main' ||
		interactionMode === 'plan' ||
		hasCustomInstructions
	) {
		return requestedMode;
	}

	const bootstrap = await readBootstrap(workspacePath(config));
	return bootstrap.trim() ? 'workspace' : requestedMode;
}
