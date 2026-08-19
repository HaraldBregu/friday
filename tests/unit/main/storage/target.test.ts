import { storageTarget } from '../../../../src/main/storage/storage_target';

describe('storageTarget', () => {
	it('resolves an object key beneath the selected folder', async () => {
		await expect(
			storageTarget('/data/friday', 'friday/v1/agent/notes/today.md', 'friday/v1/agent/')
		).resolves.toBe('/data/friday/notes/today.md');
	});

	it.each([
		['another prefix', 'friday/v1/wiki/notes.md'],
		['a parent traversal', 'friday/v1/agent/../notes.md'],
		['an empty path segment', 'friday/v1/agent/notes//today.md'],
	])('rejects %s', async (_name, key) => {
		await expect(storageTarget('/data/friday', key, 'friday/v1/agent/')).rejects.toThrow(
			/Storage object/
		);
	});
});
