import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const root = '/tmp/friday-storage-protected-test';

jest.mock('../../../../src/main/shared/user_data_location', () => ({
	userDataLocation: () => root,
}));

import { normalizeStoragePaths } from '../../../../src/main/storage/storage_paths';
import { walkFiles } from '../../../../src/main/storage/storage_walk';

beforeEach(() => {
	rmSync(root, { recursive: true, force: true });
	mkdirSync(`${root}/settings`, { recursive: true });
	mkdirSync(`${root}/providers/openai`, { recursive: true });
	writeFileSync(`${root}/settings/providers.json`, '{}');
	writeFileSync(`${root}/settings/provider-vault.json`, '{}');
	writeFileSync(`${root}/providers/openai/manifest.json`, '{}');
	writeFileSync(`${root}/notes.md`, 'safe');
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

it.each([
	`${root}/settings/providers.json`,
	`${root}/settings/provider-vault.json`,
	`${root}/providers`,
	`${root}/providers/openai/manifest.json`,
])('rejects direct file synchronization of %s', (value) => {
	expect(() => normalizeStoragePaths([value])).toThrow('cannot be synchronized as a file');
});

it('excludes provider data when a parent Friday folder is selected', async () => {
	await expect(walkFiles(root)).resolves.toEqual([`${root}/notes.md`]);
});
