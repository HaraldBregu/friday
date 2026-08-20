import { BrowserWindow, dialog, ipcMain } from 'electron';
import { CoderIpc } from '../../../../src/main/ipc/coder';
import { CoderChannels } from '../../../../src/shared/ipc_channels_definitions';
import type { Coder } from '../../../../src/main/coder';
import type { EventBus } from '../../../../src/main/event_bus';

beforeEach(() => {
	(ipcMain.handle as jest.Mock).mockReset();
	(BrowserWindow.fromWebContents as jest.Mock).mockReset();
});

it('binds coder sends, events, cancellation, and directory selection to the originating window', async () => {
	const send = jest.fn().mockResolvedValue('reply');
	const cancel = jest.fn().mockReturnValue(true);
	const coder = {
		getSettings: jest.fn(),
		saveSettings: jest.fn(),
		listModels: jest.fn(),
		send,
		cancel,
		connectCodex: jest.fn(),
		cancelCodexLogin: jest.fn(),
		disconnectCodex: jest.fn(),
	} as unknown as Coder;
	const eventBus = { sendTo: jest.fn() } as unknown as EventBus;
	const sender = {};
	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue({ id: 8 });
	(dialog.showOpenDialog as jest.Mock).mockResolvedValue({
		canceled: false,
		filePaths: ['/project'],
	});
	new CoderIpc().register({ coder }, eventBus);
	const handler = (channel: string) =>
		(ipcMain.handle as jest.Mock).mock.calls.find(([registered]) => registered === channel)?.[1];

	await expect(handler(CoderChannels.send)({ sender }, ' prompt ', 'run-1')).resolves.toEqual({
		success: true,
		data: 'reply',
	});
	expect(send).toHaveBeenCalledWith(8, 'run-1', 'prompt', expect.any(Function));
	send.mock.calls[0][3]({ type: 'status', runId: 'run-1', status: 'started' });
	expect(eventBus.sendTo).toHaveBeenCalledWith(8, CoderChannels.response, {
		type: 'status',
		runId: 'run-1',
		status: 'started',
	});

	await expect(handler(CoderChannels.cancel)({ sender }, 'run-1')).resolves.toEqual({
		success: true,
		data: true,
	});
	expect(cancel).toHaveBeenCalledWith('run-1', 8);
	await expect(handler(CoderChannels.pickDirectory)({ sender })).resolves.toEqual({
		success: true,
		data: '/project',
	});
});
