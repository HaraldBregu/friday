const listExtensions = jest.fn(() => []);
const loadExtension = jest.fn();
const importExtensions = jest.fn();
const openRoot = jest.fn();
const deleteExtension = jest.fn();
const closeExtension = jest.fn();
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
	closeExtension,
}));
jest.mock('../../../../src/main/ipc/core/gateway', () => ({
	registerQuery: jest.fn(),
	registerCommand: jest.fn(),
	registerCommandWithEvent: jest.fn(),
}));

import type { EventBus } from '../../../../src/main/event_bus';
import { ExtensionsIpc } from '../../../../src/main/ipc/extensions';
import { registerCommand, registerCommandWithEvent } from '../../../../src/main/ipc/core/gateway';
import type { WindowFactory } from '../../../../src/main/window_factory';
import { ExtensionChannels } from '../../../../src/shared/ipc_channels_definitions';
import { BrowserWindow, dialog } from 'electron';

beforeEach(() => {
	listExtensions.mockReturnValue([extension]);
	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue(null);
	(dialog.showMessageBox as jest.Mock).mockResolvedValue({ response: 0, checkboxChecked: false });
});

const extensionRegistry = { revoke: jest.fn() };

it('opens the extensions directory in the system file explorer', () => {
	new ExtensionsIpc().register(
		{ windowFactory: {} as WindowFactory, extensionRegistry: extensionRegistry as never },
		{} as EventBus
	);

	const handler = (registerCommand as jest.Mock).mock.calls.find(
		([channel]) => channel === ExtensionChannels.openRoot
	)?.[1];
	handler();

	expect(openRoot).toHaveBeenCalledTimes(1);
});

it('uses a native confirmation before deleting an extension', async () => {
	new ExtensionsIpc().register(
		{ windowFactory: {} as WindowFactory, extensionRegistry: extensionRegistry as never },
		{} as EventBus
	);
	const owner = {};
	const event = { sender: {} };
	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue(owner);

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
	expect(closeExtension).toHaveBeenCalledWith(extension.id);

	await expect(deleteHandler(event, 'missing-extension')).rejects.toThrow(
		'Extension not found: missing-extension'
	);
});
