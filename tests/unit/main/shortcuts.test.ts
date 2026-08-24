import type { BrowserWindow } from 'electron';
import { ShortcutManager } from '../../../src/main/shortcuts';

it('does not intercept terminal keystrokes', () => {
	let listener: ((event: Electron.Event, input: Electron.Input) => void) | undefined;
	const webContents = {
		on: jest.fn((_event, callback) => {
			listener = callback;
		}),
		getURL: jest.fn(() => 'file:///Friday/index.html#/terminal'),
		send: jest.fn(),
	};
	const window = { webContents } as unknown as BrowserWindow;
	const event = { preventDefault: jest.fn() } as unknown as Electron.Event;
	const input = {
		type: 'keyDown',
		isAutoRepeat: false,
		key: 'd',
		control: process.platform !== 'darwin',
		meta: process.platform === 'darwin',
		shift: false,
		alt: false,
	} as Electron.Input;

	new ShortcutManager().attach(window);
	listener?.(event, input);

	expect(event.preventDefault).not.toHaveBeenCalled();
	expect(webContents.send).not.toHaveBeenCalled();
});
