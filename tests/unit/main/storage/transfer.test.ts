const stat = jest.fn();
const readFile = jest.fn();
const mkdir = jest.fn();
const lstat = jest.fn();
const writeFile = jest.fn();
const rm = jest.fn();
const getStorage = jest.fn();
const walkFiles = jest.fn();
const putObject = jest.fn();
const listObjects = jest.fn();
const getObject = jest.fn();

jest.mock('node:fs', () => ({
	promises: { stat, readFile, mkdir, lstat, writeFile, rm },
}));
jest.mock('../../../../src/main/storage/storage_store', () => ({ getStorage }));
jest.mock('../../../../src/main/storage/storage_walk', () => ({ walkFiles }));
jest.mock('../../../../src/main/storage/storage_put', () => ({ putObject }));
jest.mock('../../../../src/main/storage/storage_list', () => ({ listObjects }));
jest.mock('../../../../src/main/storage/storage_get', () => ({ getObject }));
jest.mock('../../../../src/main/storage/storage_prefix', () => ({
	storagePrefix: () => 'friday/v1/agent/',
}));

import { pullFiles } from '../../../../src/main/storage/storage_pull';
import { pushFiles } from '../../../../src/main/storage/storage_push';

const storage = {
	id: 'backup',
	name: 'Friday backup',
	endpoint: 'https://storage.example.com',
	region: 'us-east-1',
	accessKeyId: 'access',
	secretAccessKey: 'secret',
	bucket: 'friday',
	forcePathStyle: false,
	paths: ['/data/agent'],
	syncEnabled: true,
	syncCronExpression: '0 3 * * *',
};

beforeEach(() => {
	getStorage.mockReturnValue(storage);
	stat.mockResolvedValue({ isDirectory: () => true });
	readFile.mockResolvedValue(Buffer.from('hello'));
	mkdir.mockResolvedValue(undefined);
	lstat.mockResolvedValue({ isSymbolicLink: () => false });
	writeFile.mockResolvedValue(undefined);
	putObject.mockResolvedValue(undefined);
	getObject.mockResolvedValue(Buffer.from('cloud'));
});

it('backs up selected files within the Friday-owned prefix', async () => {
	walkFiles.mockResolvedValue(['/data/agent/notes/today.md']);

	await expect(pushFiles('backup')).resolves.toEqual({
		uploaded: ['/data/agent/notes/today.md'],
		failed: [],
	});
	expect(putObject).toHaveBeenCalledWith(
		'backup',
		'friday/v1/agent/notes/today.md',
		Buffer.from('hello')
	);
});

it('restores cloud files without deleting unmatched local files', async () => {
	listObjects.mockResolvedValue([
		{ key: 'friday/v1/agent/notes/today.md', size: 5, lastModified: undefined },
	]);

	await expect(pullFiles('backup')).resolves.toEqual({
		downloaded: ['friday/v1/agent/notes/today.md'],
		skipped: [],
		failed: [],
	});
	expect(writeFile).toHaveBeenCalledWith('/data/agent/notes/today.md', Buffer.from('cloud'));
	expect(rm).not.toHaveBeenCalled();
});
