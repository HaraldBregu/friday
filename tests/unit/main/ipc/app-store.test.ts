jest.mock('../../../../src/main/ipc/core/gateway', () => ({
	registerCommandWithEvent: jest.fn(),
	registerQueryWithEvent: jest.fn(),
}));

import type { IpcMainInvokeEvent } from 'electron';
import { registerExtensionStoreIpc } from '../../../../src/main/ipc/extension_store';
import {
	registerCommandWithEvent,
	registerQueryWithEvent,
} from '../../../../src/main/ipc/core/gateway';
import { AppChannels } from '../../../../src/shared/ipc_channels_definitions';

describe('extension store IPC', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('derives the namespace from the IPC sender', async () => {
		const extensionRegistry = {
			resolve: jest.fn((sender: { id: number }) => (sender.id === 7 ? 'draw' : 'demo')),
		};
		const extensionStorage = {
			get: jest.fn((_extensionId: string, key: string) => key),
			set: jest.fn(),
			delete: jest.fn(),
			readFile: jest.fn(async () => new Uint8Array([1])),
			writeFile: jest.fn(async () => undefined),
			deleteFile: jest.fn(async () => undefined),
		};
		registerExtensionStoreIpc({
			extensionRegistry: extensionRegistry as never,
			extensionStorage: extensionStorage as never,
		});

		const query = (channel: string) =>
			(registerQueryWithEvent as jest.Mock).mock.calls.find(([name]) => name === channel)?.[1];
		const command = (channel: string) =>
			(registerCommandWithEvent as jest.Mock).mock.calls.find(([name]) => name === channel)?.[1];
		const event = { sender: { id: 7 } } as IpcMainInvokeEvent;

		expect(query(AppChannels.getExtensionStoreValue)(event, 'config')).toBe('config');
		command(AppChannels.setExtensionStoreValue)(event, 'config', { ready: true });
		command(AppChannels.deleteExtensionStoreValue)(event, 'config');
		await expect(query(AppChannels.readExtensionStoreFile)(event, 'data.bin')).resolves.toEqual(
			new Uint8Array([1])
		);
		await command(AppChannels.writeExtensionStoreFile)(event, 'data.bin', new Uint8Array([2]));
		await command(AppChannels.deleteExtensionStoreFile)(event, 'data.bin');
		expect(extensionRegistry.resolve).toHaveBeenCalledWith(event.sender);
		expect(extensionStorage.get).toHaveBeenCalledWith('draw', 'config');
		expect(extensionStorage.set).toHaveBeenCalledWith('draw', 'config', { ready: true });
		expect(extensionStorage.delete).toHaveBeenCalledWith('draw', 'config');
		expect(extensionStorage.readFile).toHaveBeenCalledWith('draw', 'data.bin');
		expect(extensionStorage.writeFile).toHaveBeenCalledWith(
			'draw',
			'data.bin',
			new Uint8Array([2])
		);
		expect(extensionStorage.deleteFile).toHaveBeenCalledWith('draw', 'data.bin');
	});

	it('rejects senders that are not registered extension views', () => {
		const extensionRegistry = {
			resolve: jest.fn(() => {
				throw new Error('Extension storage is only available to registered extension views.');
			}),
		};
		registerExtensionStoreIpc({
			extensionRegistry: extensionRegistry as never,
			extensionStorage: {} as never,
		});
		const get = (registerQueryWithEvent as jest.Mock).mock.calls.find(
			([channel]) => channel === AppChannels.getExtensionStoreValue
		)?.[1];

		expect(() => get({ sender: { id: 1 } }, 'config')).toThrow('registered extension views');
	});
});
