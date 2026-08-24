import { ShellDetector } from '../../../../src/main/terminal/shell';

it('uses the configured Unix shell and login mode on macOS', () => {
	const detector = new ShellDetector(
		'darwin',
		{ SHELL: '/opt/homebrew/bin/fish' },
		(executable) => executable === '/opt/homebrew/bin/fish'
	);

	expect(detector.detect()).toEqual({
		executable: '/opt/homebrew/bin/fish',
		args: ['-l'],
	});
});

it('prefers PowerShell 7 when it is available on Windows PATH', () => {
	const detector = new ShellDetector(
		'win32',
		{ PATH: 'C:\\Tools;C:\\Windows\\System32', SystemRoot: 'C:\\Windows' },
		(executable) => executable === 'C:\\Tools\\pwsh.exe'
	);

	expect(detector.detect()).toEqual({ executable: 'C:\\Tools\\pwsh.exe', args: ['-NoLogo'] });
});
