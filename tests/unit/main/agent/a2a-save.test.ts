const mockDiscover = jest.fn();
const mockCreateFromAgentCard = jest.fn();
const mockClientFactory = jest.fn();

jest.mock('../../../../src/main/agent/a2a/discover', () => ({ discoverA2aAgent: mockDiscover }));
jest.mock('@a2a-js/sdk/client', () => ({ ClientFactory: mockClientFactory }));

import { publicA2aAgent } from '../../../../src/main/agent/a2a/public';
import { saveA2aAgent } from '../../../../src/main/agent/a2a/save';
import { getA2aAgents, setA2aAgents } from '../../../../src/main/agent/a2a/store';
import { testA2aAgent } from '../../../../src/main/agent/a2a/test';

const card = {
	name: 'Remote',
	description: 'Remote agent',
	supportedInterfaces: [{ url: 'https://agent.example/a2a', protocolBinding: 'JSONRPC', protocolVersion: '1.0', tenant: '' }],
	capabilities: { streaming: true, extensions: [] },
	defaultInputModes: ['text/plain'],
	defaultOutputModes: ['text/plain'],
	skills: [{ name: 'Research' }],
};

beforeEach(() => {
	setA2aAgents([]);
	mockDiscover.mockResolvedValue(card);
	mockClientFactory.mockImplementation(() => ({ createFromAgentCard: mockCreateFromAgentCard }));
	mockCreateFromAgentCard.mockResolvedValue({});
});

it('uses a stored token when editing the same authenticated endpoint', async () => {
	setA2aAgents([{ id: 'saved', name: 'Saved', url: 'https://agent.example', token: 'secret', enabled: true, skills: [] }]);
	const saved = await saveA2aAgent({ id: 'saved', name: 'Updated', url: 'https://agent.example/', token: '' });

	expect(mockDiscover).toHaveBeenCalledWith('https://agent.example', 'secret');
	expect(saved).toMatchObject({ id: 'saved', name: 'Updated', token: 'secret' });
	expect(getA2aAgents()).toEqual([saved]);
});

it('does not forward a stored token when the endpoint changes', async () => {
	setA2aAgents([{ id: 'saved', name: 'Saved', url: 'https://old.example', token: 'secret', enabled: true, skills: [] }]);
	const saved = await saveA2aAgent({ id: 'saved', name: 'Updated', url: 'https://new.example', token: '' });

	expect(mockDiscover).toHaveBeenCalledWith('https://new.example', undefined);
	expect(saved).not.toHaveProperty('token');
});

it('rejects unknown update IDs before discovery', async () => {
	await expect(saveA2aAgent({ id: 'missing', name: '', url: 'https://agent.example' })).rejects.toThrow('A2A agent not found');
	expect(mockDiscover).not.toHaveBeenCalled();
});

it('tests transport compatibility and reuses stored edit credentials', async () => {
	setA2aAgents([{ id: 'saved', name: 'Saved', url: 'https://agent.example', token: 'secret', enabled: true, skills: [] }]);
	await expect(testA2aAgent({ id: 'saved', name: '', url: 'https://agent.example', token: '' })).resolves.toMatchObject({ name: 'Remote', streaming: true });
	expect(mockDiscover).toHaveBeenCalledWith('https://agent.example', 'secret');
	expect(mockCreateFromAgentCard).toHaveBeenCalledWith(card);
});

it('does not persist cards with incompatible transports or required extensions', async () => {
	mockCreateFromAgentCard.mockRejectedValueOnce(new Error('No compatible transport found'));
	await expect(saveA2aAgent({ name: '', url: 'https://agent.example' })).rejects.toThrow('No compatible transport');
	expect(getA2aAgents()).toEqual([]);

	mockDiscover.mockResolvedValueOnce({ ...card, capabilities: { streaming: true, extensions: [{ uri: 'urn:required', required: true }] } });
	await expect(saveA2aAgent({ name: '', url: 'https://agent.example' })).rejects.toThrow('unsupported extension');
	expect(getA2aAgents()).toEqual([]);
});

it('redacts the bearer token from public records', () => {
	expect(publicA2aAgent({ id: 'saved', name: 'Saved', url: 'https://agent.example', token: 'secret', enabled: true, skills: [] })).toEqual({
		id: 'saved', name: 'Saved', url: 'https://agent.example', enabled: true, skills: [],
	});
});
