import { BrowserWindow, ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import type { EventBus } from '../../../../src/main/event_bus';
import { TerminalIpc } from '../../../../src/main/ipc/terminal';
import type { LoggerService } from '../../../../src/main/shared';
import type { PtyManager } from '../../../../src/main/terminal/manager';
import type { WindowContextManager } from '../../../../src/main/window_context';
import { TerminalChannels } from '../../../../src/shared/ipc_channels_definitions';

function createEvent(): IpcMainInvokeEvent {
	const mainFrame = {};
	return {
		sender: { id: 7, mainFrame },
		senderFrame: mainFrame,
	} as unknown as IpcMainInvokeEvent;
}

it('validates create requests and accepts only registered main windows', async () => {
	const manager = {
		create: jest.fn(async (_sender, request) => ({
			...request,
			shell: '/bin/zsh',
			cwd: process.cwd(),
			createdAt: 1,
		})),
		kill: jest.fn(),
		write: jest.fn(),
		resize: jest.fn(),
	} as unknown as PtyManager;
	const logger = { info: jest.fn(), warn: jest.fn() } as unknown as LoggerService;
	const windows = { has: jest.fn(() => true) } as unknown as WindowContextManager;
	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue({ id: 42 });

	new TerminalIpc().register({ logger, manager, windows }, {} as EventBus);
	const handler = (ipcMain.handle as jest.Mock).mock.calls.find(
		([channel]) => channel === TerminalChannels.create
	)?.[1];
	const event = createEvent();

	await expect(handler(event, { id: 'terminal-valid', cols: 80, rows: 24 })).resolves.toMatchObject({
		success: true,
		data: { id: 'terminal-valid', shell: '/bin/zsh' },
	});
	await expect(handler(event, { id: 'bad', cols: Number.NaN, rows: 0 })).resolves.toMatchObject({
		success: false,
		error: { message: 'Terminal session ID is invalid.' },
	});

	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue(null);
	await expect(handler(event, { id: 'terminal-denied', cols: 80, rows: 24 })).resolves.toMatchObject({
		success: false,
		error: { message: 'Terminal IPC is unavailable to this renderer.' },
	});
});
