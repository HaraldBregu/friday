import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ExtensionStorage } from '../../../../src/main/extensions/extension_store';

describe('extension storage', () => {
	let root: string;

	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), 'friday-extension-store-'));
	});

	afterEach(() => {
		fs.rmSync(root, { recursive: true, force: true });
	});

	it('isolates JSON values by extension ID', () => {
		const storage = new ExtensionStorage(root);
		expect(storage.get('draw', 'config')).toBeUndefined();

		storage.set('draw', 'config', { color: 'blue', size: 2 });
		storage.set('demo', 'config', { color: 'red' });

		expect(storage.get('draw', 'config')).toEqual({ color: 'blue', size: 2 });
		expect(storage.get('demo', 'config')).toEqual({ color: 'red' });
		storage.delete('draw', 'config');
		storage.delete('draw', 'missing');
		expect(storage.get('draw', 'config')).toBeUndefined();
	});

	it('rejects invalid keys and values', () => {
		const storage = new ExtensionStorage(root);
		expect(() => storage.set('draw', '', 'value')).toThrow('store key');
		for (const key of ['__proto__', 'constructor', 'prototype', '__internal__']) {
			expect(() => storage.set('draw', key, 'value')).toThrow('store key');
		}
		expect(() => storage.set('draw', 'value', Number.NaN)).toThrow('store value');
		const sparse = new Array(1) as never;
		expect(() => storage.set('draw', 'value', sparse)).toThrow('store value');
		expect(() => storage.set('../draw', 'value', true)).toThrow('Invalid extension ID');
	});

	it('accepts literal dotted keys and repeated JSON object references', () => {
		const storage = new ExtensionStorage(root);
		const shared = { enabled: true };
		storage.set('draw', 'config.theme', { first: shared, second: shared });
		expect(storage.get('draw', 'config.theme')).toEqual({ first: shared, second: shared });
	});

	it('round-trips, overwrites, and deletes nested binary files', async () => {
		const storage = new ExtensionStorage(root);
		await storage.writeFile('draw', 'scenes/current.bin', new Uint8Array([1, 2, 3]));
		expect(await storage.readFile('draw', 'scenes/current.bin')).toEqual(new Uint8Array([1, 2, 3]));

		await storage.writeFile('draw', 'scenes/current.bin', new Uint8Array([4, 5]));
		expect(await storage.readFile('draw', 'scenes/current.bin')).toEqual(new Uint8Array([4, 5]));
		await expect(storage.readFile('demo', 'scenes/current.bin')).rejects.toThrow('not found');

		await storage.deleteFile('draw', 'scenes/current.bin');
		await storage.deleteFile('draw', 'scenes/current.bin');
		await expect(storage.readFile('draw', 'scenes/current.bin')).rejects.toThrow('not found');
	});

	it.each(['', '../outside', '/outside', 'C:/outside', 'nested/../outside', 'nested\\outside'])(
		'rejects unsafe file path %p',
		async (filePath) => {
			const storage = new ExtensionStorage(root);
			await expect(storage.writeFile('draw', filePath, new Uint8Array())).rejects.toThrow(
				'Invalid extension file path'
			);
		}
	);

	it('rejects directory targets and final file symlinks', async () => {
		const storage = new ExtensionStorage(root);
		await storage.writeFile('draw', '..notes/file.bin', new Uint8Array([1]));
		fs.mkdirSync(path.join(root, 'draw', 'files', 'folder'));
		await expect(storage.readFile('draw', 'folder')).rejects.toThrow('regular file');

		if (process.platform === 'win32') return;
		const outside = path.join(root, 'outside.bin');
		fs.writeFileSync(outside, 'outside');
		fs.symlinkSync(outside, path.join(root, 'draw', 'files', 'link.bin'));
		await expect(storage.readFile('draw', 'link.bin')).rejects.toThrow('regular file');
	});

	it('rejects symlinks inside the files folder', async () => {
		if (process.platform === 'win32') return;
		const storage = new ExtensionStorage(root);
		await storage.writeFile('draw', 'safe/file.bin', new Uint8Array([1]));
		const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'friday-extension-outside-'));
		try {
			fs.rmSync(path.join(root, 'draw', 'files', 'safe'), { recursive: true });
			fs.symlinkSync(outside, path.join(root, 'draw', 'files', 'safe'));
			await expect(storage.readFile('draw', 'safe/file.bin')).rejects.toThrow(
				'Invalid extension storage directory'
			);
			await expect(storage.writeFile('draw', 'safe/file.bin', new Uint8Array([2]))).rejects.toThrow(
				'Invalid extension storage directory'
			);
		} finally {
			fs.rmSync(outside, { recursive: true, force: true });
		}
	});

	it('rejects a symlinked value store file', () => {
		if (process.platform === 'win32') return;
		const storage = new ExtensionStorage(root);
		const namespace = path.join(root, 'draw');
		const outside = path.join(root, 'outside.json');
		fs.mkdirSync(namespace, { recursive: true });
		fs.writeFileSync(outside, '{}');
		fs.symlinkSync(outside, path.join(namespace, 'store.json'));

		expect(() => storage.set('draw', 'config', { ready: true })).toThrow(
			'Invalid extension store file'
		);
	});
});
