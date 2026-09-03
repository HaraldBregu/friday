import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { deleteExtension } from '../../../../src/main/extensions/extension_delete';

it('deletes only a validated extension directory', () => {
	const appLocation = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-extension-delete-'));
	const extension = path.join(appLocation, 'extensions', 'demo-extension');
	const extensionData = path.join(appLocation, 'extensions-data', 'demo-extension');
	const outside = path.join(appLocation, 'outside');
	fs.mkdirSync(extension, { recursive: true });
	fs.mkdirSync(extensionData, { recursive: true });
	fs.writeFileSync(path.join(extensionData, 'store.json'), '{}');
	fs.mkdirSync(outside);

	try {
		deleteExtension('demo-extension', appLocation);
		expect(fs.existsSync(extension)).toBe(false);
		expect(fs.existsSync(extensionData)).toBe(true);
		expect(() => deleteExtension('../outside', appLocation)).toThrow('Invalid extension ID.');
		expect(fs.existsSync(outside)).toBe(true);
	} finally {
		fs.rmSync(appLocation, { recursive: true, force: true });
	}
});
