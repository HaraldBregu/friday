const readFile = jest.fn();
const mkdir = jest.fn();
const lstat = jest.fn();
const writeFile = jest.fn();
const rename = jest.fn();
const rm = jest.fn();
const getStorageSettings = jest.fn();
const walkFiles = jest.fn();
const putObject = jest.fn();
const listObjects = jest.fn();
const getObject = jest.fn();

jest.mock('node:fs', () => ({
	existsSync: () => false,
	realpathSync: (value: string) => value,
	promises: { readFile, mkdir, lstat, writeFile, rename, rm },
}));
jest.mock('node:crypto', () => ({ randomUUID: () => 'restore' }));
jest.mock('../../../../src/main/storage/storage_store', () => ({ getStorageSettings }));
jest.mock('../../../../src/main/storage/storage_walk', () => ({ walkFiles }));
jest.mock('../../../../src/main/storage/storage_put', () => ({ putObject }));
jest.mock('../../../../src/main/storage/storage_list', () => ({ listObjects }));
jest.mock('../../../../src/main/storage/storage_get', () => ({ getObject }));
jest.mock('../../../../src/main/storage/storage_prefix', () => ({
	storagePrefix: () => 'kucedr/v1/agent/',
}));

import { pullFiles } from '../../../../src/main/storage/storage_pull';
import { pushFiles } from '../../../../src/main/storage/storage_push';
import { STORAGE_MAX_OBJECT_BYTES } from '../../../../src/main/storage/limits';

const storage = {
	paths: ['/data/agent'],
	syncEnabled: true,
	syncCronExpression: '0 3 * * *',
};

beforeEach(() => {
	jest.clearAllMocks();
	getStorageSettings.mockReturnValue(storage);
	lstat.mockResolvedValue({ size: 5, isDirectory: () => true, isSymbolicLink: () => false });
	readFile.mockResolvedValue(Buffer.from('hello'));
	mkdir.mockResolvedValue(undefined);
	writeFile.mockResolvedValue(undefined);
	rename.mockResolvedValue(undefined);
	rm.mockResolvedValue(undefined);
	putObject.mockResolvedValue(undefined);
	getObject.mockResolvedValue(Buffer.from('cloud'));
});

it('rejects a symbolic link selected as a backup root', async () => {
	lstat.mockResolvedValueOnce({ isDirectory: () => false, isSymbolicLink: () => true });

	await expect(pushFiles({} as never)).resolves.toMatchObject({
		uploaded: [],
		failed: [{ path: '/data/agent' }],
	});
	expect(walkFiles).not.toHaveBeenCalled();
	expect(putObject).not.toHaveBeenCalled();
});

it('backs up selected files within the Kucedr-owned prefix', async () => {
	walkFiles.mockResolvedValue(['/data/agent/notes/today.md']);
	const auth = {} as never;

	await expect(pushFiles(auth)).resolves.toEqual({
		uploaded: ['/data/agent/notes/today.md'],
		failed: [],
	});
	expect(putObject).toHaveBeenCalledWith(
		auth,
		'kucedr/v1/agent/notes/today.md',
		Buffer.from('hello')
	);
});

it('rejects oversized local files before reading or uploading them', async () => {
	walkFiles.mockResolvedValue(['/data/agent/archive.bin']);
	lstat
		.mockResolvedValueOnce({
			size: 0,
			isDirectory: () => true,
			isSymbolicLink: () => false,
		})
		.mockResolvedValueOnce({
			size: STORAGE_MAX_OBJECT_BYTES + 1,
			isDirectory: () => false,
			isSymbolicLink: () => false,
		});

	await expect(pushFiles({} as never)).resolves.toMatchObject({
		uploaded: [],
		failed: [{ path: '/data/agent/archive.bin', error: expect.stringContaining('50 MiB') }],
	});
	expect(readFile).not.toHaveBeenCalled();
	expect(putObject).not.toHaveBeenCalled();
});

it('restores cloud files without deleting unmatched local files', async () => {
	listObjects.mockResolvedValue([
		{ key: 'kucedr/v1/agent/notes/today.md', size: 5, lastModified: undefined },
	]);

	const auth = {} as never;
	await expect(pullFiles(auth)).resolves.toEqual({
		downloaded: ['kucedr/v1/agent/notes/today.md'],
		skipped: [],
		failed: [],
	});
	expect(writeFile).toHaveBeenCalledWith(
		'/data/agent/notes/today.md.kucedr-restore.tmp',
		Buffer.from('cloud'),
		{ flag: 'wx' }
	);
	expect(rename).toHaveBeenCalledWith(
		'/data/agent/notes/today.md.kucedr-restore.tmp',
		'/data/agent/notes/today.md'
	);
	expect(getObject).toHaveBeenCalledWith(auth, 'kucedr/v1/agent/notes/today.md');
	expect(rm).not.toHaveBeenCalled();
});

it('rejects a restore target that is a symbolic link', async () => {
	listObjects.mockResolvedValue([
		{ key: 'kucedr/v1/agent/notes/today.md', size: 5, lastModified: undefined },
	]);
	lstat.mockImplementation(async (value: string) => ({
		isDirectory: () => true,
		isSymbolicLink: () => value.endsWith('today.md'),
	}));

	await expect(pullFiles({} as never)).resolves.toMatchObject({
		downloaded: [],
		failed: [{ path: 'kucedr/v1/agent/notes/today.md' }],
	});
	expect(getObject).not.toHaveBeenCalled();
	expect(writeFile).not.toHaveBeenCalled();
});

it('rejects oversized remote files before downloading them', async () => {
	listObjects.mockResolvedValue([
		{
			key: 'kucedr/v1/agent/archive.bin',
			size: STORAGE_MAX_OBJECT_BYTES + 1,
			lastModified: undefined,
		},
	]);

	await expect(pullFiles({} as never)).resolves.toMatchObject({
		downloaded: [],
		failed: [{ path: 'kucedr/v1/agent/archive.bin', error: expect.stringContaining('50 MiB') }],
	});
	expect(getObject).not.toHaveBeenCalled();
	expect(writeFile).not.toHaveBeenCalled();
});
