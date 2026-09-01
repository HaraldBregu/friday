import type { BrowserWindowConstructorOptions } from 'electron';

export function getPlatformTranslucencyOptions(): Partial<BrowserWindowConstructorOptions> {
	if (process.platform === 'darwin') {
		return {
			vibrancy: 'under-window',
			visualEffectState: 'followWindow',
		};
	}

	return {};
}
