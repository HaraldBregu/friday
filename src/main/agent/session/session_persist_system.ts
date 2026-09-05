import { writeFileSync } from 'node:fs';
import type { SessionState } from './session_types';
import { ensureSession } from './session_ensure_session';
import { sessionPath } from './session_session_path';

export function persistSystemPrompt(state: SessionState, systemPrompt: string): void {
	if (!state.sessionsPath || (state.lease && !state.lease.active)) return;
	ensureSession(state);
	writeFileSync(
		sessionPath(state.sessionsPath, state.folderName, 'SYSTEM.md'),
		`${systemPrompt}\n`,
		'utf8'
	);
}
