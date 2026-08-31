import { safeStorage } from 'electron';
import { EncryptedSessionStorage } from '../../../../src/main/cloud/session';

const encryptionAvailable = safeStorage.isEncryptionAvailable as jest.Mock;
const selectedBackend = safeStorage.getSelectedStorageBackend as jest.Mock;
const encrypt = safeStorage.encryptString as jest.Mock;
const decrypt = safeStorage.decryptString as jest.Mock;

beforeEach(() => {
	encryptionAvailable.mockReturnValue(true);
	selectedBackend.mockReturnValue('gnome_libsecret');
	encrypt.mockImplementation((value: string) => Buffer.from(value, 'utf8'));
	decrypt.mockImplementation((value: Buffer) => value.toString('utf8'));
});

it('persists auth values only as OS-encrypted payloads', async () => {
	const storage = new EncryptedSessionStorage();
	const value = JSON.stringify({ access_token: 'access-sentinel', refresh_token: 'refresh-sentinel' });
	await storage.setItem('session-key', value);

	const internals = storage as unknown as {
		memory: Map<string, string>;
		store: { get: (key: 'items') => Record<string, string> };
	};
	const persisted = internals.store.get('items');
	expect(JSON.stringify(persisted)).not.toContain('access-sentinel');
	expect(JSON.stringify(persisted)).not.toContain('refresh-sentinel');
	expect(encrypt).toHaveBeenCalled();

	internals.memory.clear();
	await expect(storage.getItem('session-key')).resolves.toBe(value);
});

it('uses memory only when secure system storage is unavailable', async () => {
	encryptionAvailable.mockReturnValue(false);
	const storage = new EncryptedSessionStorage();
	await storage.setItem('session-key', 'session-sentinel');

	const internals = storage as unknown as {
		store: { get: (key: 'items') => Record<string, string> };
	};
	expect(internals.store.get('items')).toEqual({});
	await expect(storage.getItem('session-key')).resolves.toBe('session-sentinel');
	expect(encrypt).not.toHaveBeenCalled();
});

it('does not return corrupted encrypted values', async () => {
	const storage = new EncryptedSessionStorage();
	const internals = storage as unknown as {
		store: { set: (key: 'items', value: Record<string, string>) => void };
	};
	internals.store.set('items', { 'session-key': Buffer.from('corrupt').toString('base64') });
	decrypt.mockImplementation(() => {
		throw new Error('unreadable');
	});
	await expect(storage.getItem('session-key')).resolves.toBeNull();
});
