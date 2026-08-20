import type {
	StorageOperationDependencies,
	StorageOperations,
} from '../../../../src/main/storage/storage_operations';

const loadOperations = async (): Promise<typeof StorageOperations> =>
	(await import('../../../../src/main/storage/storage_operations')).StorageOperations;

describe('storage operations', () => {
	it('returns running state immediately and retains it until deferred work finishes', async () => {
		let finishBackup: ((value: { uploaded: string[]; failed: [] }) => void) | undefined;
		const backup = jest.fn(
			() =>
				new Promise<{ uploaded: string[]; failed: [] }>((resolve) => {
					finishBackup = resolve;
				})
		);
		const releaseSuspension = jest.fn();
		const onStatusChanged = jest.fn();
		const dependencies: StorageOperationDependencies = {
			backup,
			restore: jest.fn(),
			lock: (_id, operation) => operation(),
			preventSuspension: () => releaseSuspension,
		};
		const Operations = await loadOperations();
		const operations = new Operations(onStatusChanged, dependencies);

		const running = operations.backup('profile-1', 'manual');

		expect(running.state).toBe('running');
		expect(operations.getStatus('profile-1')).toEqual(running);
		expect(onStatusChanged).toHaveBeenCalledWith(running);
		const completion = operations.wait(running.operationId);
		finishBackup?.({ uploaded: ['one', 'two'], failed: [] });
		const finished = await completion;

		expect(finished).toEqual(
			expect.objectContaining({
				state: 'succeeded',
				transferred: 2,
				failed: 0,
			})
		);
		expect(finished?.revision).toBeGreaterThan(running.revision);
		expect(operations.getStatus('profile-1')).toEqual(finished);
		expect(releaseSuspension).toHaveBeenCalledTimes(1);
	});

	it('publishes partial and fatal terminal states', async () => {
		const onStatusChanged = jest.fn();
		const dependencies: StorageOperationDependencies = {
			backup: jest
				.fn()
				.mockResolvedValueOnce({ uploaded: ['one'], failed: [{ path: 'two', error: 'no' }] })
				.mockRejectedValueOnce(new Error('offline')),
			restore: jest.fn(),
			lock: (_id, operation) => operation(),
			preventSuspension: () => jest.fn(),
		};
		const Operations = await loadOperations();
		const operations = new Operations(onStatusChanged, dependencies);

		const partial = operations.backup('profile-1', 'scheduled');
		expect(await operations.wait(partial.operationId)).toEqual(
			expect.objectContaining({ state: 'partial', transferred: 1, failed: 1 })
		);
		const failed = operations.backup('profile-1', 'manual');
		expect(await operations.wait(failed.operationId)).toEqual(
			expect.objectContaining({ state: 'failed', error: 'offline' })
		);
	});

	it('reuses a matching active operation and rejects a conflicting restore', async () => {
		const dependencies: StorageOperationDependencies = {
			backup: jest.fn(() => new Promise(() => undefined)),
			restore: jest.fn(),
			lock: (_id, operation) => operation(),
			preventSuspension: () => jest.fn(),
		};
		const Operations = await loadOperations();
		const operations = new Operations(jest.fn(), dependencies);
		const running = operations.backup('profile-1', 'manual');

		expect(operations.backup('profile-1', 'manual')).toEqual(running);
		expect(() => operations.restore('profile-1')).toThrow('already running');
	});
});
