const listApps = jest.fn(() => []);
const loadApp = jest.fn();
const importApps = jest.fn();
const openRoot = jest.fn();
const deleteApp = jest.fn();
const destroyApp = jest.fn();
const app = {
	id: 'demo-app',
	title: 'Demo App',
	description: 'A demo app.',
	metadata: { version: '1.0.0', category: 'Demo', entry: 'index.html' },
};

jest.mock('../../../../src/main/apps/app_index', () => ({
	listApps,
	loadApp,
	importApps,
	openRoot,
	deleteApp,
	destroyApp,
}));
jest.mock('../../../../src/main/ipc/core/gateway', () => ({
	registerQueryWithEvent: jest.fn(),
	registerCommandWithEvent: jest.fn(),
}));

import type { EventBus } from '../../../../src/main/event_bus';
import { AppsIpc } from '../../../../src/main/ipc/apps';
import { registerCommandWithEvent } from '../../../../src/main/ipc/core/gateway';
import type { WindowFactory } from '../../../../src/main/window_factory';
import { AppChannels } from '../../../../src/shared/ipc_channels_definitions';
import { BrowserWindow, dialog } from 'electron';

beforeEach(() => {
	jest.clearAllMocks();
	listApps.mockReturnValue([app]);
	(dialog.showMessageBox as jest.Mock).mockResolvedValue({ response: 0, checkboxChecked: false });
});

const appRegistry = { has: jest.fn(() => false), revoke: jest.fn() };
const windows = { has: jest.fn(() => true) };
const mainFrame = {};
const sender = { mainFrame };
const event = { sender, senderFrame: mainFrame };
const owner = { id: 1, webContents: sender };

it('opens the apps directory in the system file explorer', () => {
	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue(owner);
	new AppsIpc().register(
		{
			windowFactory: {} as WindowFactory,
			appRegistry: appRegistry as never,
			windows: windows as never,
		},
		{} as EventBus
	);

	const handler = (registerCommandWithEvent as jest.Mock).mock.calls.find(
		([channel]) => channel === AppChannels.openRoot
	)?.[1];
	handler(event);

	expect(openRoot).toHaveBeenCalledTimes(1);
});

it('uses a native confirmation before deleting an app', async () => {
	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue(owner);
	new AppsIpc().register(
		{
			windowFactory: {} as WindowFactory,
			appRegistry: appRegistry as never,
			windows: windows as never,
		},
		{} as EventBus
	);

	const deleteHandler = (registerCommandWithEvent as jest.Mock).mock.calls.find(
		([channel]) => channel === AppChannels.delete
	)?.[1];

	await expect(deleteHandler(event, app.id)).resolves.toBe(false);
	expect(deleteApp).not.toHaveBeenCalled();
	expect(dialog.showMessageBox).toHaveBeenCalledWith(
		owner,
		expect.objectContaining({
			type: 'warning',
			buttons: ['Cancel', 'Delete App'],
			cancelId: 0,
			defaultId: 0,
			message: 'Delete “Demo App”?',
		})
	);

	(dialog.showMessageBox as jest.Mock).mockResolvedValueOnce({
		response: 1,
		checkboxChecked: false,
	});
	await expect(deleteHandler(event, app.id)).resolves.toBe(true);
	expect(deleteApp).toHaveBeenCalledTimes(1);
	expect(deleteApp).toHaveBeenCalledWith(app.id);
	expect(appRegistry.revoke).toHaveBeenCalledWith(app.id);
	expect(destroyApp).toHaveBeenCalledWith(app.id);

	await expect(deleteHandler(event, 'missing-app')).rejects.toThrow(
		'App not found: missing-app'
	);
});
