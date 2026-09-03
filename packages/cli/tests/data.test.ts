import assert from 'node:assert/strict';
import test from 'node:test';
import { kucedrDataDirectory } from '../src/data.js';

test('resolves the Electron userData location on each platform', () => {
	assert.equal(
		kucedrDataDirectory({ platform: 'darwin', home: '/Users/ada', env: {} }),
		'/Users/ada/Library/Application Support/Kucedr'
	);
	assert.equal(
		kucedrDataDirectory({
			platform: 'win32',
			home: 'C:\\Users\\Ada',
			env: { APPDATA: 'C:\\Users\\Ada\\AppData\\Roaming' },
		}),
		'C:\\Users\\Ada\\AppData\\Roaming/Kucedr'
	);
	assert.equal(
		kucedrDataDirectory({
			platform: 'linux',
			home: '/home/ada',
			env: { XDG_CONFIG_HOME: '/tmp/config' },
		}),
		'/tmp/config/Kucedr'
	);
});
