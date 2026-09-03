import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { preparePluginSource } from '../src/fetch.js';
import { createPluginFixture } from './fixture.js';

test('packs and extracts a package spec without running scripts', async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kucedr-fetch-test-'));
	try {
		const fixture = await createPluginFixture(root);
		const source = await preparePluginSource(`file:${fixture}`);
		try {
			const manifest = JSON.parse(
				await fs.readFile(path.join(source.directory, 'manifest.json'), 'utf8')
			) as { id: string };
			assert.equal(manifest.id, 'package-one');
		} finally {
			await source.dispose();
		}
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});
