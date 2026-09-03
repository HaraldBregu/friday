import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { installPlugin } from '../src/install.js';
import { createPluginFixture } from './fixture.js';

test('installs a local plugin and requires force to replace it', async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kucedr-install-test-'));
	const dataDir = path.join(root, 'data');
	try {
		const fixture = await createPluginFixture(root);
		const installed = await installPlugin(fixture, { dataDir });
		assert.equal(installed.id, 'package-one');
		assert.equal(installed.restartRequired, true);
		assert.equal(
			JSON.parse(await fs.readFile(path.join(installed.destination, 'manifest.json'), 'utf8'))
				.version,
			'1.0.0'
		);

		await assert.rejects(installPlugin(fixture, { dataDir }), /already installed/);
		await createPluginFixture(root, '2.0.0');
		const updated = await installPlugin(fixture, { dataDir, force: true });
		assert.equal(
			JSON.parse(await fs.readFile(path.join(updated.destination, 'manifest.json'), 'utf8'))
				.version,
			'2.0.0'
		);
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});

test('rejects a plugin with a missing contributed file', async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kucedr-invalid-test-'));
	try {
		const fixture = await createPluginFixture(root);
		await fs.rm(path.join(fixture, 'skills', 'hello', 'SKILL.md'));
		await assert.rejects(
			installPlugin(fixture, { dataDir: path.join(root, 'data') }),
			/does not exist/
		);
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});

test('rejects duplicate contribution ids', async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kucedr-duplicate-test-'));
	try {
		const fixture = await createPluginFixture(root);
		const manifestPath = path.join(fixture, 'manifest.json');
		const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as {
			contributes: { skills: unknown[] };
		};
		manifest.contributes.skills.push(manifest.contributes.skills[0]);
		await fs.writeFile(manifestPath, JSON.stringify(manifest));
		await assert.rejects(
			installPlugin(fixture, { dataDir: path.join(root, 'data') }),
			/Duplicate skill id/
		);
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});
