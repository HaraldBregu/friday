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

beforeEach(() => {
	(extensionRegistry.resolve as jest.Mock).mockReturnValue('workspace');
	(openExtensionWindows as Map<string, unknown>).clear();
});

afterEach(() => {
	(openExtensionWindows as Map<string, unknown>).clear();
});

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

it('forwards titlebar options to the owning shell and button clicks to its extension', () => {
	const shellSend = jest.fn();
	const shellContents = { send: shellSend };
	const extensionSend = jest.fn();
	const extensionContents = {
		isDestroyed: jest.fn(() => false),
		send: extensionSend,
	};
	const host = {
		isDestroyed: jest.fn(() => false),
		webContents: shellContents,
	};
	(openExtensionWindows as Map<string, unknown>).set('workspace', {
		window: host,
		ready: true,
		contents: extensionContents,
		titlebarOptions: null,
	});
	new WindowIpc().register(
		{ logger: { info: jest.fn() } as unknown as LoggerService, extensionRegistry },
		{} as EventBus
	);
	const setOptions = (ipcMain.on as jest.Mock).mock.calls.find(
		([channel]) => channel === WindowChannels.titlebarOptionsSet
	)?.[1];
	const clickButton = (ipcMain.on as jest.Mock).mock.calls.find(
		([channel]) => channel === WindowChannels.titlebarButtonClick
	)?.[1];
	const options = {
		title: 'Workspace',
		leftButtons: [
			{
				id: 'toggle-sidebar',
				label: 'Collapse sidebar',
				icon: 'panel-left',
				expanded: true,
			},
		],
		rightButtons: [],
		sidebarOpen: true,
		sidebarWidth: 240,
	};

	setOptions({ sender: extensionContents }, options);

	expect(shellSend).toHaveBeenCalledWith(WindowChannels.titlebarOptionsChanged, options);
	clickButton({ sender: extensionContents }, 'toggle-sidebar');
	expect(extensionSend).not.toHaveBeenCalled();
	clickButton({ sender: shellContents }, 'toggle-sidebar');
	expect(extensionSend).toHaveBeenCalledWith(
		WindowChannels.titlebarButtonClicked,
		'toggle-sidebar'
	);
});

it('rejects malformed titlebar options and unknown button ids', () => {
	const shellSend = jest.fn();
	const shellContents = { send: shellSend };
	const extensionSend = jest.fn();
	const extensionContents = {
		isDestroyed: jest.fn(() => false),
		send: extensionSend,
	};
	(openExtensionWindows as Map<string, unknown>).set('workspace', {
		window: { isDestroyed: jest.fn(() => false), webContents: shellContents },
		ready: true,
		contents: extensionContents,
		titlebarOptions: null,
	});
	new WindowIpc().register(
		{ logger: { info: jest.fn() } as unknown as LoggerService, extensionRegistry },
		{} as EventBus
	);
	const setOptions = (ipcMain.on as jest.Mock).mock.calls.find(
		([channel]) => channel === WindowChannels.titlebarOptionsSet
	)?.[1];
	const clickButton = (ipcMain.on as jest.Mock).mock.calls.find(
		([channel]) => channel === WindowChannels.titlebarButtonClick
	)?.[1];

	setOptions(
		{ sender: extensionContents },
		{
			title: 'Workspace',
			leftButtons: [{ id: 'toggle', label: 'Toggle', icon: 'arbitrary-svg' }],
		}
	);
	expect(shellSend).not.toHaveBeenCalled();

	setOptions(
		{ sender: extensionContents },
		{
			title: 'Workspace',
			leftButtons: [{ id: 'toggle', label: 'Toggle', icon: 'panel-left' }],
		}
	);
	clickButton({ sender: shellContents }, 'unknown');
	expect(extensionSend).not.toHaveBeenCalled();
});
