const registerCommandWithEvent = jest.fn();
const registerQueryWithEvent = jest.fn();
const getStorageSettings = jest.fn();

jest.mock('../../../../src/main/ipc/core/gateway', () => ({
	registerCommandWithEvent,
	registerQueryWithEvent,
}));
jest.mock('../../../../src/main/storage', () => ({
	getStorageSettings,
	pickFolders: jest.fn(),
	pullFiles: jest.fn(),
	pushFiles: jest.fn(),
	rescheduleStorageSync: jest.fn(),
	saveStorageSettings: jest.fn(),
	syncFolders: jest.fn(),
	withStorageLock: jest.fn(),
}));

import { StorageIpc } from '../../../../src/main/ipc/storage';
import { StorageChannels } from '../../../../src/shared/ipc_channels_definitions';

const extensionRegistry = { has: jest.fn() };
const storageOperations = {
	getStatus: jest.fn(),
	isRunning: jest.fn(),
	backup: jest.fn(),
	restore: jest.fn(),
};
const event = { sender: { id: 1 } };

beforeEach(() => {
	jest.clearAllMocks();
	extensionRegistry.has.mockReturnValue(false);
	storageOperations.getStatus.mockReturnValue(undefined);
	storageOperations.isRunning.mockReturnValue(false);
	new StorageIpc().register(
		{
			extensionRegistry: extensionRegistry as never,
			storageOperations: storageOperations as never,
		},
		{} as never
	);
});

it('reads authoritative operation status and starts manual backups in main', () => {
	storageOperations.getStatus.mockReturnValue({ state: 'running' });
	storageOperations.backup.mockReturnValue({ state: 'running' });
	const query = registerQueryWithEvent.mock.calls.find(
		([channel]) => channel === StorageChannels.getOperationStatus
	)?.[1];
	const command = registerCommandWithEvent.mock.calls.find(
		([channel]) => channel === StorageChannels.backup
	)?.[1];

	expect(query(event)).toEqual({ state: 'running' });
	expect(command(event)).toEqual({ state: 'running' });
	expect(storageOperations.backup).toHaveBeenCalledWith('manual');
});

it('allows the app renderer to read storage sync settings', () => {
	getStorageSettings.mockReturnValue({ paths: [] });
	const handler = registerQueryWithEvent.mock.calls.find(
		([channel]) => channel === StorageChannels.getSettings
	)?.[1];
	expect(handler(event)).toEqual({ paths: [] });
});

it('rejects cloud storage access from extension views', () => {
	extensionRegistry.has.mockReturnValue(true);
	const query = registerQueryWithEvent.mock.calls.find(
		([channel]) => channel === StorageChannels.getSettings
	)?.[1];
	const command = registerCommandWithEvent.mock.calls.find(
		([channel]) => channel === StorageChannels.backup
	)?.[1];
	expect(() => query(event)).toThrow('unavailable to extension views');
	expect(() => command(event)).toThrow('unavailable to extension views');
});
