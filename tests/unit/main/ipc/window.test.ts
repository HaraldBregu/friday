import { BrowserWindow, ipcMain, Menu } from 'electron';
import type { IpcMainInvokeEvent, MenuItemConstructorOptions } from 'electron';

import type { EventBus } from '../../../../src/main/event_bus';
import { WindowIpc } from '../../../../src/main/ipc/window';
import type { LoggerService } from '../../../../src/main/shared';
import { openExtensionWindows } from '../../../../src/main/extensions/extension_render';
import type { ExtensionRegistry } from '../../../../src/main/extensions/extension_registry';
import { WindowChannels } from '../../../../src/shared/ipc_channels_definitions';

const extensionRegistry = {
	resolve: jest.fn(() => 'workspace'),
} as unknown as ExtensionRegistry;

it('shows a native context menu and returns the selected item id', async () => {
	const fromWebContents = jest.fn(() => ({}));
	let builtTemplate: MenuItemConstructorOptions[] = [];
	Object.assign(BrowserWindow, { fromWebContents });

	(Menu.buildFromTemplate as jest.Mock).mockImplementation(
		(template: MenuItemConstructorOptions[]) => {
			builtTemplate = template;
			let close: (() => void) | undefined;
			return {
				once: (_event: string, listener: () => void) => {
					close = listener;
				},
				popup: () => {
					template[0].click?.({} as never, {} as never, {} as never);
					close?.();
				},
			};
		}
	);

	new WindowIpc().register(
		{ logger: { info: jest.fn() } as unknown as LoggerService, extensionRegistry },
		{} as EventBus
	);
	const handler = (ipcMain.handle as jest.Mock).mock.calls.find(
		([channel]) => channel === WindowChannels.showContextMenu
	)?.[1];

	await expect(
		handler({ sender: {} } as IpcMainInvokeEvent, [
			{ id: 'open', label: 'Open' },
			{ type: 'separator' },
			{ type: 'role', role: 'copy' },
		])
	).resolves.toEqual({ success: true, data: 'open' });
	expect(fromWebContents).toHaveBeenCalledTimes(1);
	expect(builtTemplate[2]).toEqual({ role: 'copy', label: undefined });

	const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
	await expect(
		handler({ sender: {} } as IpcMainInvokeEvent, [
			{ type: 'role', role: 'reload' },
		] as never)
	).resolves.toMatchObject({
		success: false,
		error: { message: 'Unsupported context menu role: reload' },
	});
	errorLog.mockRestore();
});

it('forwards extension sidebar widths to the matching titlebar shell', () => {
	const send = jest.fn();
	const host = {
		isDestroyed: jest.fn(() => false),
		webContents: { send },
	};
	(openExtensionWindows as Map<string, unknown>).set('workspace', { window: host });
	new WindowIpc().register(
		{ logger: { info: jest.fn() } as unknown as LoggerService, extensionRegistry },
		{} as EventBus
	);
	const listener = (ipcMain.on as jest.Mock).mock.calls.find(
		([channel]) => channel === WindowChannels.titlebarSidebarWidthSet
	)?.[1];

	listener({ sender: {} }, 240);

	expect(send).toHaveBeenCalledWith(WindowChannels.titlebarSidebarWidthChanged, 240);
	(openExtensionWindows as Map<string, unknown>).delete('workspace');
});
