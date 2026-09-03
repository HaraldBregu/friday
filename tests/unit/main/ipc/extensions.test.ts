const listExtensions = jest.fn(() => []);
const loadExtension = jest.fn();
const importExtensions = jest.fn();
const openRoot = jest.fn();
const deleteExtension = jest.fn();
const destroyExtension = jest.fn();
const extension = {
	id: 'demo-extension',
	title: 'Demo Extension',
	description: 'A demo extension.',
	metadata: { version: '1.0.0', category: 'Demo', entry: 'index.html' },
};

jest.mock('../../../../src/main/extensions/extension_index', () => ({
	listExtensions,
	loadExtension,
	importExtensions,
	openRoot,
	deleteExtension,
	destroyExtension,
}));
jest.mock('../../../../src/main/ipc/core/gateway', () => ({
	registerQueryWithEvent: jest.fn(),
	registerCommandWithEvent: jest.fn(),
}));

import type { EventBus } from '../../../../src/main/event_bus';
import { ExtensionsIpc } from '../../../../src/main/ipc/extensions';
import { registerCommandWithEvent } from '../../../../src/main/ipc/core/gateway';
import type { WindowFactory } from '../../../../src/main/window_factory';
import { ExtensionChannels } from '../../../../src/shared/ipc_channels_definitions';
import { BrowserWindow, dialog } from 'electron';

beforeEach(() => {
	jest.clearAllMocks();
	listExtensions.mockReturnValue([extension]);
	(dialog.showMessageBox as jest.Mock).mockResolvedValue({ response: 0, checkboxChecked: false });
});

const extensionRegistry = { has: jest.fn(() => false), revoke: jest.fn() };
const windows = { has: jest.fn(() => true) };
const mainFrame = {};
const sender = { mainFrame };
const event = { sender, senderFrame: mainFrame };
const owner = { id: 1, webContents: sender };

it('opens the extensions directory in the system file explorer', () => {
	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue(owner);
	new ExtensionsIpc().register(
		{
			windowFactory: {} as WindowFactory,
			extensionRegistry: extensionRegistry as never,
			windows: windows as never,
		},
		{} as EventBus
	);

	const handler = (registerCommandWithEvent as jest.Mock).mock.calls.find(
		([channel]) => channel === ExtensionChannels.openRoot
	)?.[1];
	handler(event);

	expect(openRoot).toHaveBeenCalledTimes(1);
});

it('uses a native confirmation before deleting an extension', async () => {
	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue(owner);
	new ExtensionsIpc().register(
		{
			windowFactory: {} as WindowFactory,
			extensionRegistry: extensionRegistry as never,
			windows: windows as never,
		},
		{} as EventBus
	);

	const deleteHandler = (registerCommandWithEvent as jest.Mock).mock.calls.find(
		([channel]) => channel === ExtensionChannels.delete
	)?.[1];

	await expect(deleteHandler(event, extension.id)).resolves.toBe(false);
	expect(deleteExtension).not.toHaveBeenCalled();
	expect(dialog.showMessageBox).toHaveBeenCalledWith(
		owner,
		expect.objectContaining({
			type: 'warning',
			buttons: ['Cancel', 'Delete Extension'],
			cancelId: 0,
			defaultId: 0,
			message: 'Delete “Demo Extension”?',
		})
	);

	(dialog.showMessageBox as jest.Mock).mockResolvedValueOnce({
		response: 1,
		checkboxChecked: false,
	});
	await expect(deleteHandler(event, extension.id)).resolves.toBe(true);
	expect(deleteExtension).toHaveBeenCalledTimes(1);
	expect(deleteExtension).toHaveBeenCalledWith(extension.id);
	expect(extensionRegistry.revoke).toHaveBeenCalledWith(extension.id);
	expect(destroyExtension).toHaveBeenCalledWith(extension.id);

	await expect(deleteHandler(event, 'missing-extension')).rejects.toThrow(
		'Extension not found: missing-extension'
	);
});
