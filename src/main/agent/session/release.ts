import type { SessionState } from './session_types';

export function releaseSession(state: SessionState): void {
	state.lease?.release();
}
