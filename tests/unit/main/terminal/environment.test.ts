import { EnvironmentManager } from '../../../../src/main/terminal/environment';

it('merges the macOS login-shell environment without losing inherited values', async () => {
	const logger = { warn: jest.fn() };
	const readShellEnvironment = jest.fn(async () => ({
		PATH: '/opt/homebrew/bin:/usr/bin',
		NVM_DIR: '/Users/test/.nvm',
		TERM: 'screen',
	}));
	const manager = new EnvironmentManager(
		logger as never,
		'darwin',
		{ PATH: '/usr/bin', KUCEDR_VALUE: 'preserved' },
		readShellEnvironment
	);

	await expect(manager.get('/bin/zsh')).resolves.toMatchObject({
		PATH: '/opt/homebrew/bin:/usr/bin',
		NVM_DIR: '/Users/test/.nvm',
		KUCEDR_VALUE: 'preserved',
		TERM: 'xterm-256color',
		COLORTERM: 'truecolor',
		TERM_PROGRAM: 'Kucedr',
	});
	expect(readShellEnvironment).toHaveBeenCalledWith('/bin/zsh');
});

it('falls back to the inherited environment when shell discovery fails', async () => {
	const logger = { warn: jest.fn() };
	const manager = new EnvironmentManager(
		logger as never,
		'darwin',
		{ PATH: '/usr/bin' },
		async () => {
			throw new Error('shell failed');
		}
	);

	await expect(manager.get('/bin/zsh')).resolves.toMatchObject({ PATH: '/usr/bin' });
	expect(logger.warn).toHaveBeenCalledTimes(1);
});
