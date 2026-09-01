const invoke = jest.fn();
const on = jest.fn();
const removeListener = jest.fn();

jest.mock('electron', () => ({
	ipcRenderer: { invoke, on, removeListener },
}));

import { storage } from '../../../../src/preload/storage';
import { StorageChannels } from '../../../../src/shared/ipc_channels_definitions';

beforeEach(() => {
	jest.clearAllMocks();
	invoke.mockResolvedValue({ success: true, data: [] });
});

it('queries operation status through the typed storage channel', async () => {
	await storage.getOperationStatus();

	expect(invoke).toHaveBeenCalledWith(StorageChannels.getOperationStatus);
});

it('subscribes and removes the exact operation status event handler', () => {
	const callback = jest.fn();
	const unsubscribe = storage.onOperationStatusChanged(callback);
	const handler = on.mock.calls[0][1];
	const status = { revision: 1 };

	handler({}, status);
	expect(callback).toHaveBeenCalledWith(status);
	unsubscribe();
	expect(removeListener).toHaveBeenCalledWith(StorageChannels.operationStatusChanged, handler);
});
