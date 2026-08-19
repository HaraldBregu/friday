const registerCommandWithEvent = jest.fn();
const registerQueryWithEvent = jest.fn();
const getA2aAgents = jest.fn();
const removeA2aAgent = jest.fn();
const saveA2aAgent = jest.fn();
const testA2aAgent = jest.fn();

jest.mock('../../../../src/main/ipc/core/gateway', () => ({ registerCommandWithEvent, registerQueryWithEvent }));
jest.mock('../../../../src/main/agent/a2a', () => ({ getA2aAgents, removeA2aAgent, saveA2aAgent, testA2aAgent }));

import { A2aIpc } from '../../../../src/main/ipc/a2a';
import { A2aChannels } from '../../../../src/shared/ipc_channels_definitions';

const extensionRegistry = { has: jest.fn() };
const event = { sender: { id: 1 } };

function command(channel: string): (...args: unknown[]) => unknown {
	return registerCommandWithEvent.mock.calls.find(([registered]) => registered === channel)?.[1];
}

function query(channel: string): (...args: unknown[]) => unknown {
	return registerQueryWithEvent.mock.calls.find(([registered]) => registered === channel)?.[1];
}

beforeEach(() => {
	jest.clearAllMocks();
	extensionRegistry.has.mockReturnValue(false);
	new A2aIpc().register({ extensionRegistry: extensionRegistry as never }, {} as never);
});

it('redacts tokens from list and save results', async () => {
	const record = { id: 'agent', name: 'Agent', url: 'https://agent.example', token: 'secret', enabled: true, skills: [] };
	getA2aAgents.mockReturnValue([record]);
	saveA2aAgent.mockResolvedValue(record);

	expect(query(A2aChannels.list)(event)).toEqual([{ id: 'agent', name: 'Agent', url: 'https://agent.example', enabled: true, skills: [] }]);
	await expect(command(A2aChannels.save)(event, { name: '', url: record.url })).resolves.toEqual({ id: 'agent', name: 'Agent', url: record.url, enabled: true, skills: [] });
});

it('rejects A2A settings access from extension views', async () => {
	extensionRegistry.has.mockReturnValue(true);
	expect(() => query(A2aChannels.list)(event)).toThrow('unavailable to extension views');
	await expect(command(A2aChannels.save)(event, { name: '', url: 'https://agent.example' })).rejects.toThrow('unavailable to extension views');
});
