import { withStorageLock } from '../../../../src/main/storage/storage_lock';

describe('withStorageLock', () => {
	it('rejects overlapping operations and releases the lock afterward', async () => {
		let release: (() => void) | undefined;
		const first = withStorageLock(() => new Promise<void>((resolve) => (release = resolve)));

		await expect(withStorageLock(async () => undefined)).rejects.toThrow('already running');
		release?.();
		await first;
		await expect(withStorageLock(async () => 'done')).resolves.toBe('done');
	});
});
