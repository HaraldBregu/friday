const schedule = jest.fn();
const validate = jest.fn();
const destroy = jest.fn();
const getStorages = jest.fn();
const isAutoSyncable = jest.fn();
const runProviderSync = jest.fn();

jest.mock('node-cron', () => ({
	__esModule: true,
	default: { schedule, validate },
}));

jest.mock('../../../../src/main/storage/storage_store', () => ({
	getStorages,
}));

jest.mock('../../../../src/main/storage/storage_auto_sync', () => ({
	isAutoSyncable,
	runProviderSync,
}));

import {
	rescheduleStorageSync,
	startStorageSync,
	stopStorageSync,
} from '../../../../src/main/storage/storage_sync_schedule';

describe('storage sync scheduling', () => {
	const logger = { info: jest.fn(), error: jest.fn() };
	const storage = {
		id: 'backup',
		name: 'Backup',
		syncCronExpression: '0 3 * * *',
	};

	beforeEach(() => {
		stopStorageSync();
		schedule.mockClear();
		validate.mockClear();
		destroy.mockClear();
		getStorages.mockClear();
		isAutoSyncable.mockClear();
		runProviderSync.mockClear();
		logger.info.mockClear();
		logger.error.mockClear();
		schedule.mockReturnValue({ destroy });
		validate.mockReturnValue(true);
		getStorages.mockReturnValue([storage]);
		isAutoSyncable.mockReturnValue(true);
		runProviderSync.mockResolvedValue(undefined);
	});

	afterEach(() => stopStorageSync());

	it('schedules a no-overlap cron task and runs the provider sync', async () => {
		startStorageSync(logger);

		expect(schedule).toHaveBeenCalledWith('0 3 * * *', expect.any(Function), {
			noOverlap: true,
		});
		await schedule.mock.calls[0][1]();
		expect(runProviderSync).toHaveBeenCalledWith(storage, logger);
	});

	it('destroys prior tasks when storage settings change', () => {
		startStorageSync(logger);
		rescheduleStorageSync();

		expect(destroy).toHaveBeenCalledTimes(1);
		expect(schedule).toHaveBeenCalledTimes(2);
	});

	it('schedules every enabled storage profile independently', () => {
		getStorages.mockReturnValue([
			storage,
			{ ...storage, id: 'archive', name: 'Archive', syncCronExpression: '0 4 * * *' },
		]);

		startStorageSync(logger);

		expect(schedule).toHaveBeenCalledTimes(2);
		expect(schedule).toHaveBeenNthCalledWith(1, '0 3 * * *', expect.any(Function), {
			noOverlap: true,
		});
		expect(schedule).toHaveBeenNthCalledWith(2, '0 4 * * *', expect.any(Function), {
			noOverlap: true,
		});
	});

	it('does not schedule an invalid cron expression', () => {
		validate.mockReturnValue(false);
		startStorageSync(logger);

		expect(schedule).not.toHaveBeenCalled();
		expect(logger.error).toHaveBeenCalledWith('Storage', 'Invalid sync schedule for "Backup"');
	});
});
