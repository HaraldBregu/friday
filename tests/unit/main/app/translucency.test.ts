import { getPlatformTranslucencyOptions } from '../../../../src/main/translucency';

const platform = Object.getOwnPropertyDescriptor(process, 'platform');

afterEach(() => {
	Object.defineProperty(process, 'platform', platform!);
});

it('enables the main window translucency effect on macOS', () => {
	Object.defineProperty(process, 'platform', { value: 'darwin' });

	expect(getPlatformTranslucencyOptions()).toEqual({
		vibrancy: 'under-window',
		visualEffectState: 'followWindow',
	});
});

it('leaves native translucency disabled on other platforms', () => {
	Object.defineProperty(process, 'platform', { value: 'linux' });

	expect(getPlatformTranslucencyOptions()).toEqual({});
});
