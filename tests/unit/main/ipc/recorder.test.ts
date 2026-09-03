const microphone = { complete: jest.fn() };
const camera = { complete: jest.fn() };
const screen = { complete: jest.fn() };

jest.mock('../../../../src/main/recorder', () => ({ microphone, camera, screen }));

import { BrowserWindow, ipcMain } from 'electron';
import { RecorderChannels } from '../../../../src/shared/ipc_channels_definitions';
import { RecorderIpc } from '../../../../src/main/ipc/recorder';

describe('recorder IPC', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('exposes only capture completion and rejects extension views', async () => {
		const mainFrame = {};
		const mainSender = { id: 21, mainFrame };
		const extensionFrame = {};
		const extensionSender = { id: 22, mainFrame: extensionFrame };
		const window = { id: 1, webContents: mainSender };
		jest
			.mocked(BrowserWindow.fromWebContents)
			.mockImplementation((sender) => (sender === mainSender ? (window as never) : null));
		const windows = { has: (id: number) => id === window.id };
		const extensions = { has: (sender: unknown) => sender === extensionSender };
		new RecorderIpc().register({ windows, extensions } as never, {} as never);

		expect(jest.mocked(ipcMain.handle).mock.calls.map(([channel]) => channel)).toEqual([
			RecorderChannels.microphone.complete,
			RecorderChannels.camera.complete,
			RecorderChannels.screen.complete,
		]);
		const handler = jest
			.mocked(ipcMain.handle)
			.mock.calls.find(([channel]) => channel === RecorderChannels.screen.complete)?.[1] as (
			event: unknown,
			result: unknown
		) => Promise<{ success: boolean }>;
		const result = { id: 'recording-id', base64: 'cmVjb3JkZWQ=' };

		await expect(
			handler({ sender: extensionSender, senderFrame: extensionFrame } as never, result)
		).resolves.toMatchObject({ success: false });
		expect(screen.complete).not.toHaveBeenCalled();

		await expect(
			handler({ sender: mainSender, senderFrame: mainFrame } as never, result)
		).resolves.toMatchObject({ success: true });
		expect(screen.complete).toHaveBeenCalledWith(result, mainSender.id);
	});
});
