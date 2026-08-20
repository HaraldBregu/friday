import { BrowserWindow, webContents } from 'electron';
import { EventBus } from '../../../src/main/event_bus';

it('broadcasts storage status only to live application windows', () => {
	const send = jest.fn();
	const destroyedSend = jest.fn();
	(BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([
		{ isDestroyed: () => false, webContents: { send } },
		{ isDestroyed: () => true, webContents: { send: destroyedSend } },
	]);

	new EventBus().broadcastToWindows('storage:operation-status:changed', { revision: 1 });

	expect(send).toHaveBeenCalledWith('storage:operation-status:changed', { revision: 1 });
	expect(destroyedSend).not.toHaveBeenCalled();
	expect(webContents.getAllWebContents).not.toHaveBeenCalled();
});
