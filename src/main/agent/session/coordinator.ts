import type { Message } from '../types';
import type { SessionLease } from './session_types';

interface SessionEntry {
	messages: Message[];
	controllers: Set<AbortController>;
}

export class SessionCoordinator {
	private readonly entries = new Map<string, SessionEntry>();

	open(key: string, messages: Message[]): SessionLease {
		const entry = this.entries.get(key) ?? { messages, controllers: new Set<AbortController>() };
		this.entries.set(key, entry);
		const controller = new AbortController();
		entry.controllers.add(controller);
		const lease: SessionLease = {
			active: true,
			messages: entry.messages,
			signal: controller.signal,
			release: () => {
				lease.active = false;
				entry.controllers.delete(controller);
				if (entry.controllers.size === 0 && this.entries.get(key) === entry) this.entries.delete(key);
			},
		};
		controller.signal.addEventListener('abort', () => { lease.active = false; }, { once: true });
		return lease;
	}

	invalidate(key: string): void {
		const entry = this.entries.get(key);
		if (!entry) return;
		this.entries.delete(key);
		for (const controller of entry.controllers) {
			controller.abort(new DOMException('Conversation changed or removed.', 'AbortError'));
		}
		entry.controllers.clear();
	}
}
