const registerCommandWithEvent = jest.fn();
const registerQueryWithEvent = jest.fn();
const getA2aAgents = jest.fn();
const removeA2aAgent = jest.fn();
const saveA2aAgent = jest.fn();
const testA2aAgent = jest.fn();

jest.mock('../../../../src/main/ipc/core/gateway', () => ({
	registerCommandWithEvent,
	registerQueryWithEvent,
}));
jest.mock('../../../../src/main/agent/a2a', () => ({
	getA2aAgents,
	removeA2aAgent,
	saveA2aAgent,
	testA2aAgent,
}));

import { A2aIpc } from '../../../../src/main/ipc/a2a';
import { A2aChannels } from '../../../../src/shared/ipc_channels_definitions';
import { BrowserWindow } from 'electron';

const appRegistry = { has: jest.fn() };
const event = { sender: { id: 1 } };

function command(channel: string): (...args: unknown[]) => unknown {
	return registerCommandWithEvent.mock.calls.find(([registered]) => registered === channel)?.[1];
}

function query(channel: string): (...args: unknown[]) => unknown {
	return registerQueryWithEvent.mock.calls.find(([registered]) => registered === channel)?.[1];
}

beforeEach(() => {
	jest.clearAllMocks();
	appRegistry.has.mockReturnValue(false);
	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue({ id: 1 });
	new A2aIpc().register({ appRegistry: appRegistry as never }, {} as never);
});

it('redacts tokens from list and save results', async () => {
	const record = {
		id: 'agent',
		name: 'Agent',
		url: 'https://agent.example',
		authType: 'bearer',
		credential: 'secret',
		enabled: true,
		skills: [],
	};
	getA2aAgents.mockReturnValue([record]);
	saveA2aAgent.mockResolvedValue(record);

	expect(query(A2aChannels.list)(event)).toEqual([
		{
			id: 'agent',
			name: 'Agent',
			url: 'https://agent.example',
			authType: 'bearer',
			enabled: true,
			skills: [],
			hasCredential: true,
		},
	]);
	await expect(command(A2aChannels.save)(event, { name: '', url: record.url })).resolves.toEqual({
		id: 'agent',
		name: 'Agent',
		url: record.url,
		authType: 'bearer',
		enabled: true,
		skills: [],
		hasCredential: true,
	});
});

it('rejects unknown or revoked non-window renderers', () => {
	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue(null);
	expect(() => query(A2aChannels.list)(event)).toThrow('unavailable to app views');
});

it('rejects A2A settings access from app views', async () => {
	appRegistry.has.mockReturnValue(true);
	expect(() => query(A2aChannels.list)(event)).toThrow('unavailable to app views');
	await expect(
		command(A2aChannels.save)(event, { name: '', url: 'https://agent.example' })
	).rejects.toThrow('unavailable to app views');
});
