import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { importExtensions } from '../../../../src/main/extensions/extension_import';

describe('extension import', () => {
	let appLocation: string;

	beforeEach(() => {
		appLocation = fs.mkdtempSync(path.join(os.tmpdir(), 'friday-extension-import-'));
	});

	afterEach(() => {
		fs.rmSync(appLocation, { recursive: true, force: true });
	});

	it('does not delete an extension imported from its installed directory', () => {
		const installed = path.join(appLocation, 'extensions', 'project');
		fs.mkdirSync(installed, { recursive: true });
		fs.writeFileSync(path.join(installed, 'index.html'), 'installed');
		fs.writeFileSync(
			path.join(installed, 'manifest.json'),
			JSON.stringify({
				title: 'Project',
				description: 'Project extension',
				metadata: { version: '1.0.0', category: 'utility', entry: 'index.html' },
			})
		);

		expect(importExtensions([installed], appLocation)).toMatchObject({
			imported: [],
			skipped: [{ sourcePath: installed, reason: 'Source folder is already installed.' }],
		});
		expect(fs.readFileSync(path.join(installed, 'index.html'), 'utf8')).toBe('installed');
	});

	it('replaces an installed extension through a staged copy', () => {
		const installed = path.join(appLocation, 'extensions', 'project');
		const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'friday-extension-source-'));
		const source = path.join(sourceRoot, 'project');
		fs.mkdirSync(installed, { recursive: true });
		fs.mkdirSync(source, { recursive: true });
		fs.writeFileSync(path.join(installed, 'old.txt'), 'old');
		fs.writeFileSync(path.join(source, 'index.html'), 'replacement');
		fs.writeFileSync(
			path.join(source, 'manifest.json'),
			JSON.stringify({
				title: 'Project',
				description: 'Project extension',
				metadata: { version: '2.0.0', category: 'utility', entry: 'index.html' },
			})
		);

		try {
			expect(importExtensions([source], appLocation).imported).toHaveLength(1);
			expect(fs.readFileSync(path.join(installed, 'index.html'), 'utf8')).toBe('replacement');
			expect(fs.existsSync(path.join(installed, 'old.txt'))).toBe(false);
			expect(fs.readdirSync(path.join(appLocation, 'extensions'))).toEqual(['project']);
		} finally {
			fs.rmSync(sourceRoot, { recursive: true, force: true });
		}
	});
});
