import { BrowserWindow, dialog, ipcMain } from 'electron';
import { CoderIpc } from '../../../../src/main/ipc/coder';
import { CoderChannels } from '../../../../src/shared/ipc_channels_definitions';
import type { Coder } from '../../../../src/main/coder';
import type { EventBus } from '../../../../src/main/event_bus';

beforeEach(() => {
	jest.clearAllMocks();
});

it('streams Coder extension runs back to the originating view and scopes cancellation', async () => {
	const send = jest.fn().mockResolvedValue('reply');
	const cancel = jest.fn().mockReturnValue(true);
	const coder = {
		getSettings: jest.fn().mockReturnValue({ runtime: 'pi' }),
		send,
		cancel,
	} as unknown as Coder;
	const extensionRegistry = {
		has: jest.fn().mockReturnValue(true),
		resolve: jest.fn().mockReturnValue('coder'),
	};
	const sender = {
		id: 23,
		send: jest.fn(),
		once: jest.fn(),
		removeListener: jest.fn(),
	};
	new CoderIpc().register(
		{ coder, extensionRegistry: extensionRegistry as never },
		{} as EventBus
	);
	const handler = (channel: string) =>
		(ipcMain.handle as jest.Mock).mock.calls.find(([registered]) => registered === channel)?.[1];

	await expect(handler(CoderChannels.getSettings)({ sender })).resolves.toEqual({
		success: true,
		data: { runtime: 'pi' },
	});
	await expect(handler(CoderChannels.send)({ sender }, ' prompt ', 'run-1')).resolves.toEqual({
		success: true,
		data: 'reply',
	});
	expect(send).toHaveBeenCalledWith(23, 'run-1', 'prompt', expect.any(Function));
	send.mock.calls[0][3]({ type: 'status', runId: 'run-1', status: 'started' });
	expect(sender.send).toHaveBeenCalledWith(CoderChannels.response, {
		type: 'status',
		runId: 'run-1',
		status: 'started',
	});
	expect(sender.once).toHaveBeenCalledWith('destroyed', expect.any(Function));
	expect(sender.removeListener).toHaveBeenCalledWith('destroyed', expect.any(Function));

	await expect(handler(CoderChannels.cancel)({ sender }, 'run-1')).resolves.toEqual({
		success: true,
		data: true,
	});
	expect(cancel).toHaveBeenCalledWith('run-1', 23);
});

it('rejects Coder access from other extensions', async () => {
	const coder = { getSettings: jest.fn(), send: jest.fn() } as unknown as Coder;
	const extensionRegistry = {
		has: jest.fn().mockReturnValue(true),
		resolve: jest.fn().mockReturnValue('demo'),
	};
	new CoderIpc().register(
		{ coder, extensionRegistry: extensionRegistry as never },
		{} as EventBus
	);
	const getSettings = (ipcMain.handle as jest.Mock).mock.calls.find(
		([channel]) => channel === CoderChannels.getSettings
	)?.[1];
	const send = (ipcMain.handle as jest.Mock).mock.calls.find(
		([channel]) => channel === CoderChannels.send
	)?.[1];
	const sender = { id: 24 };

	await expect(getSettings({ sender })).resolves.toEqual(
		expect.objectContaining({
			success: false,
			error: expect.objectContaining({ message: 'Coder is only available to the Coder extension.' }),
		})
	);
	await expect(send({ sender }, 'prompt', 'run-1')).resolves.toEqual(
		expect.objectContaining({ success: false })
	);
	expect(coder.send).not.toHaveBeenCalled();
});

it('keeps configuration and authentication host-only', async () => {
	const connectCodex = jest.fn((_owner, emit) => {
		emit({ type: 'progress', message: 'Waiting' });
		return Promise.resolve({ configured: true, type: 'oauth' });
	});
	const coder = {
		saveSettings: jest.fn((settings) => settings),
		listModels: jest.fn().mockResolvedValue({ providers: [] }),
		connectCodex,
		cancelCodexLogin: jest.fn().mockReturnValue(true),
		disconnectCodex: jest.fn().mockResolvedValue(undefined),
	} as unknown as Coder;
	const extensionRegistry = { has: jest.fn().mockReturnValue(false) };
	const sender = { id: 8, send: jest.fn() };
	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue({ id: 8 });
	(dialog.showOpenDialog as jest.Mock).mockResolvedValue({
		canceled: false,
		filePaths: ['/project'],
	});
	new CoderIpc().register(
		{ coder, extensionRegistry: extensionRegistry as never },
		{} as EventBus
	);
	const handler = (channel: string) =>
		(ipcMain.handle as jest.Mock).mock.calls.find(([registered]) => registered === channel)?.[1];

	await expect(handler(CoderChannels.pickDirectory)({ sender })).resolves.toEqual({
		success: true,
		data: '/project',
	});
	await expect(handler(CoderChannels.connectCodex)({ sender })).resolves.toEqual({
		success: true,
		data: { configured: true, type: 'oauth' },
	});
	expect(connectCodex).toHaveBeenCalledWith(8, expect.any(Function));
	expect(sender.send).toHaveBeenCalledWith(CoderChannels.authEvent, {
		type: 'progress',
		message: 'Waiting',
	});

	extensionRegistry.has.mockReturnValue(true);
	await expect(handler(CoderChannels.listModels)({ sender })).resolves.toEqual(
		expect.objectContaining({ success: false })
	);
	expect(coder.listModels).not.toHaveBeenCalled();
});
