import assert from 'node:assert/strict';
import test from 'node:test';
import type { installPlugin } from '../src/install.js';
import { createProgram } from '../src/program.js';

test('launches by default and accepts the slash install alias', async () => {
	let launches = 0;
	const installs: Array<{ options: { dataDir?: string; force?: boolean }; spec: string }> = [];
	const install: typeof installPlugin = async (spec, options = {}) => {
		installs.push({ spec, options });
		return {
			id: 'package-one',
			name: 'Package One',
			version: '1.0.0',
			destination: '/tmp/kucedr/plugins/package-one',
			restartRequired: true,
		};
	};
	const dependencies = {
		install,
		launch: async () => {
			launches += 1;
		},
		tui: async () => undefined,
	};

	await createProgram(dependencies).parseAsync(['node', 'kucedr']);
	assert.equal(launches, 1);

	await createProgram(dependencies).parseAsync([
		'node',
		'kucedr',
		'/install',
		'package-one',
		'--data-dir',
		'/tmp/kucedr',
	]);
	assert.deepEqual(installs, [{ spec: 'package-one', options: { dataDir: '/tmp/kucedr' } }]);
});
