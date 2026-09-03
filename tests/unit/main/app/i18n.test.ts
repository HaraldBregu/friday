import path from 'node:path';
import { readFileSync } from 'node:fs';
import { app } from 'electron';
import { loadTranslations } from '../../../../src/main/i18n';

jest.mock('node:fs', () => ({ readFileSync: jest.fn() }));
it('loads unpackaged translations from the Electron app root', () => {
	jest.mocked(readFileSync).mockReturnValue('{"file":"File"}');

	expect(loadTranslations('en', 'menu')).toEqual({ file: 'File' });
	expect(readFileSync).toHaveBeenCalledWith(
		path.join(app.getAppPath(), 'resources/i18n/en/menu.json'),
		'utf-8'
	);
});

it('loads packaged translations from the resources directory', () => {
	jest.mocked(readFileSync).mockReturnValue('{"file":"File"}');
	const mockedApp = app as typeof app & { isPackaged: boolean };
	const previousResourcesPath = process.resourcesPath;
	mockedApp.isPackaged = true;
	process.resourcesPath = '/packaged';

	try {
		expect(loadTranslations('en', 'menu')).toEqual({ file: 'File' });
		expect(readFileSync).toHaveBeenCalledWith(
			path.join('/packaged', 'resources/i18n/en/menu.json'),
			'utf-8'
		);
	} finally {
		mockedApp.isPackaged = false;
		process.resourcesPath = previousResourcesPath;
	}
});
