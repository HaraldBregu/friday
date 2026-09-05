import { persist } from './session_persist';
import type { SessionState } from './session_types';

export function insertUserMessage(state: SessionState, index: number, content: string): void {
	if (state.lease && !state.lease.active) return;
	state.messages.splice(index, 0, { role: 'user', content });
	persist(state);
}
