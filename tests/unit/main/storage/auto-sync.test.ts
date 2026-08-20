import { runProviderSync } from '../../../../src/main/storage/storage_auto_sync';

const storage = {
	id: 'backup',
	name: 'Backup',
} as never;

it('starts scheduled backups through the shared operation service', async () => {
	const logger = { info: jest.fn(), error: jest.fn() };
	const operations = {
		backup: jest.fn().mockReturnValue({
			operationId: 'scheduled-1',
			trigger: 'scheduled',
		}),
		wait: jest.fn().mockResolvedValue({
			state: 'succeeded',
			transferred: 3,
			failed: 0,
		}),
	};

	await runProviderSync(storage, logger, operations as never);

	expect(operations.backup).toHaveBeenCalledWith('backup', 'scheduled');
	expect(operations.wait).toHaveBeenCalledWith('scheduled-1');
	expect(logger.info).toHaveBeenCalledWith('Storage', 'Auto sync "Backup" uploaded 3 file(s)');
});

it('skips a schedule tick when a manual backup is already running', async () => {
	const logger = { info: jest.fn(), error: jest.fn() };
	const operations = {
		backup: jest.fn().mockReturnValue({ operationId: 'manual-1', trigger: 'manual' }),
		wait: jest.fn(),
	};

	await runProviderSync(storage, logger, operations as never);

	expect(operations.wait).not.toHaveBeenCalled();
	expect(logger.info).toHaveBeenCalledWith(
		'Storage',
		'Auto sync "Backup" skipped; backup already running'
	);
});
