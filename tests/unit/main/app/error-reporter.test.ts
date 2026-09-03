import { app } from 'electron';

describe('process safety net', () => {
	const originalExitCode = process.exitCode;

	afterEach(() => {
		jest.restoreAllMocks();
		process.exitCode = originalExitCode;
	});

	it('requests a nonzero graceful shutdown after an uncaught exception', () => {
		const listeners = new Map<string, (...args: never[]) => void>();
		jest.spyOn(process, 'on').mockImplementation(((event: string, listener: never) => {
			listeners.set(event, listener as (...args: never[]) => void);
			return process;
		}) as typeof process.on);
		const logger = { error: jest.fn(), warn: jest.fn() };
		jest.isolateModules(() => {
			const { setupProcessSafetyNet } = require('../../../../src/main/shared/error_reporter');
			setupProcessSafetyNet(logger);
		});

		listeners.get('uncaughtException')?.(new Error('fatal') as never, 'uncaughtException' as never);

		expect(logger.error).toHaveBeenCalledWith(
			'Process',
			'uncaughtException (uncaughtException)',
			expect.objectContaining({ error: expect.stringContaining('fatal') })
		);
		expect(process.exitCode).toBe(1);
		expect(app.quit).toHaveBeenCalledTimes(1);
	});
});
