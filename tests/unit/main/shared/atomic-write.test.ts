import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { atomicWrite } from '../../../../src/main/shared/atomic_write';

it('replaces a text file atomically and removes its temporary file', async () => {
	const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'kucedr-atomic-write-'));
	const target = path.join(directory, 'state.md');
	try {
		await fs.writeFile(target, 'before', 'utf8');
		await atomicWrite(target, 'after');
		expect(await fs.readFile(target, 'utf8')).toBe('after');
		expect(await fs.readdir(directory)).toEqual(['state.md']);
	} finally {
		await fs.rm(directory, { recursive: true, force: true });
	}
});

it('keeps the target intact and cleans up when replacement fails', async () => {
	const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'kucedr-atomic-write-'));
	const target = path.join(directory, 'state.md');
	await fs.writeFile(target, 'before', 'utf8');
	const rename = jest.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('rename failed'));
	try {
		await expect(atomicWrite(target, 'after')).rejects.toThrow('rename failed');
		expect(await fs.readFile(target, 'utf8')).toBe('before');
		expect(await fs.readdir(directory)).toEqual(['state.md']);
	} finally {
		rename.mockRestore();
		await fs.rm(directory, { recursive: true, force: true });
	}
});
