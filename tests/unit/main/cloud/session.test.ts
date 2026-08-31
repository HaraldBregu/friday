import { MemorySessionStorage } from '../../../../src/main/cloud/session';

it('keeps auth values in memory without a disk store', async () => {
	const storage = new MemorySessionStorage();
	await storage.setItem('session-key', 'session-sentinel');

	expect(storage).not.toHaveProperty('store');
	await expect(storage.getItem('session-key')).resolves.toBe('session-sentinel');
});

it('removes and clears auth values', async () => {
	const storage = new MemorySessionStorage();
	await storage.setItem('first', 'one');
	await storage.setItem('second', 'two');
	await storage.removeItem('first');
	await expect(storage.getItem('first')).resolves.toBeNull();

	storage.clear();
	await expect(storage.getItem('second')).resolves.toBeNull();
});
