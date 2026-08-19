const registerCommandWithEvent = jest.fn();
const registerQueryWithEvent = jest.fn();
const getStorages = jest.fn();
const getStorageConfiguration = jest.fn();

jest.mock('../../../../src/main/ipc/core/gateway', () => ({
	registerCommandWithEvent,
	registerQueryWithEvent,
}));
jest.mock('../../../../src/main/storage', () => ({
	deleteStorageConfig: jest.fn(),
	getStorageConfiguration,
	getStorages,
	pickFolders: jest.fn(),
	pullFiles: jest.fn(),
	pushFiles: jest.fn(),
	rescheduleStorageSync: jest.fn(),
	saveStorageConfig: jest.fn(),
	saveStorageConfiguration: jest.fn(),
	syncFolders: jest.fn(),
	testConnection: jest.fn(),
	withStorageLock: jest.fn(),
}));

import { StorageIpc } from '../../../../src/main/ipc/storage';
import { StorageChannels } from '../../../../src/shared/ipc_channels_definitions';

const extensionRegistry = { has: jest.fn() };
const event = { sender: { id: 1 } };

beforeEach(() => {
	jest.clearAllMocks();
	extensionRegistry.has.mockReturnValue(false);
	new StorageIpc().register({ extensionRegistry: extensionRegistry as never }, {} as never);
});

it('allows the app renderer to read storage profiles', () => {
	getStorages.mockReturnValue([{ id: 'backup' }]);
	const handler = registerQueryWithEvent.mock.calls.find(
		([channel]) => channel === StorageChannels.getStorages
	)?.[1];
	expect(handler(event)).toEqual([{ id: 'backup' }]);
});

it('rejects cloud storage access from extension views', () => {
	extensionRegistry.has.mockReturnValue(true);
	const query = registerQueryWithEvent.mock.calls.find(
		([channel]) => channel === StorageChannels.getStorageConfiguration
	)?.[1];
	const command = registerCommandWithEvent.mock.calls.find(
		([channel]) => channel === StorageChannels.backup
	)?.[1];
	expect(() => query(event)).toThrow('unavailable to extension views');
	expect(() => command(event, 'backup')).toThrow('unavailable to extension views');
});
