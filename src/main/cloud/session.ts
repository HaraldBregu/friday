import { chmodSync } from 'node:fs';
import path from 'node:path';
import { safeStorage } from 'electron';
import Store from 'electron-store';
import { userDataLocation } from '../shared/user_data_location';

interface SessionStore {
	items: Record<string, string>;
}

interface SessionPayload {
	version: 1;
	key: string;
	value: string;
}

export class EncryptedSessionStorage {
	private readonly memory = new Map<string, string>();
	private readonly store = new Store<SessionStore>({
		name: 'supabase',
		cwd: path.resolve(userDataLocation(), 'settings'),
		accessPropertiesByDotNotation: false,
		defaults: { items: {} },
	});

	get persistent(): boolean {
		return (
			safeStorage.isEncryptionAvailable() &&
			(process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text')
		);
	}

	async getItem(key: string): Promise<string | null> {
		const volatile = this.memory.get(key);
		if (volatile !== undefined) return volatile;
		if (!this.persistent) return null;
		const encrypted = this.store.get('items')[key];
		if (!encrypted) return null;
		try {
			const payload = JSON.parse(
				safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
			) as SessionPayload;
			if (payload.version !== 1 || payload.key !== key || typeof payload.value !== 'string') {
				return null;
			}
			this.memory.set(key, payload.value);
			return payload.value;
		} catch {
			return null;
		}
	}

	async setItem(key: string, value: string): Promise<void> {
		this.memory.set(key, value);
		if (!this.persistent) return;
		const payload: SessionPayload = { version: 1, key, value };
		const items = {
			...this.store.get('items'),
			[key]: safeStorage.encryptString(JSON.stringify(payload)).toString('base64'),
		};
		this.store.set('items', items);
		this.restrictPermissions();
	}

	async removeItem(key: string): Promise<void> {
		this.memory.delete(key);
		const items = { ...this.store.get('items') };
		delete items[key];
		this.store.set('items', items);
		this.restrictPermissions();
	}

	clear(): void {
		this.memory.clear();
		this.store.set('items', {});
		this.restrictPermissions();
	}

	private restrictPermissions(): void {
		try {
			chmodSync(path.dirname(this.store.path), 0o700);
			chmodSync(this.store.path, 0o600);
		} catch {
			return;
		}
	}
}
