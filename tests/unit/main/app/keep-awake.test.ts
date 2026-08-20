import { powerSaveBlocker } from 'electron';
import { setKeepAwake } from '../../../../src/main/keep_awake';

const start = jest.mocked(powerSaveBlocker.start);
const stop = jest.mocked(powerSaveBlocker.stop);
const isStarted = jest.mocked(powerSaveBlocker.isStarted);

describe('keep awake', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		start.mockReturnValue(17);
		stop.mockReturnValue(true);
		isStarted.mockReturnValue(true);
	});

	afterEach(() => {
		setKeepAwake(false);
	});

	it('keeps both the system and display awake with one blocker', () => {
		setKeepAwake(true);
		setKeepAwake(true);

		expect(start).toHaveBeenCalledTimes(1);
		expect(start).toHaveBeenCalledWith('prevent-display-sleep');
	});

	it('replaces a blocker that is no longer active', () => {
		setKeepAwake(true);
		isStarted.mockReturnValue(false);

		setKeepAwake(true);

		expect(start).toHaveBeenCalledTimes(2);
	});

	it('stops the active blocker when disabled', () => {
		setKeepAwake(true);

		setKeepAwake(false);

		expect(stop).toHaveBeenCalledWith(17);
	});
});
