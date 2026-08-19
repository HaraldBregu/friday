import { withStorageLock } from '../../../../src/main/storage/storage_lock';

describe('withStorageLock', () => {
	it('rejects overlapping operations for one provider and releases the provider afterward', async () => {
		let release: (() => void) | undefined;
		const first = withStorageLock(
			'backup',
			() => new Promise<void>((resolve) => (release = resolve))
		);

		await expect(withStorageLock('backup', async () => undefined)).rejects.toThrow(
			'already running'
		);
		release?.();
		await first;
		await expect(withStorageLock('backup', async () => 'done')).resolves.toBe('done');
	});

	it('allows different providers to operate concurrently', async () => {
		await expect(
			Promise.all([
				withStorageLock('first', async () => 'first'),
				withStorageLock('second', async () => 'second'),
			])
		).resolves.toEqual(['first', 'second']);
	});
});
