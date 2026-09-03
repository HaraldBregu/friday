import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveLaunchTarget } from '../src/launch.js';

test('resolves platform launch targets without invoking a shell', () => {
	assert.deepEqual(resolveLaunchTarget({ platform: 'darwin', env: {} }), {
		command: 'open',
		args: ['-a', 'Kucedr'],
		detached: false,
	});
	assert.deepEqual(resolveLaunchTarget({ platform: 'linux', env: {} }), {
		command: 'kucedr-desktop',
		args: [],
		detached: true,
	});
	assert.deepEqual(
		resolveLaunchTarget({
			platform: 'win32',
			env: { LOCALAPPDATA: 'C:\\Local' },
			exists: () => true,
		}),
		{
			command: 'C:\\Local/Programs/Kucedr/Kucedr.exe',
			args: [],
			detached: true,
		}
	);
	assert.deepEqual(
		resolveLaunchTarget({
			platform: 'linux',
			env: { KUCEDR_APP_PATH: '/opt/Kucedr.AppImage' },
		}),
		{
			command: '/opt/Kucedr.AppImage',
			args: [],
			detached: true,
		}
	);
});
