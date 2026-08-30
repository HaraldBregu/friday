const mockDiscover = jest.fn();
const mockCreateClient = jest.fn();

jest.mock('../../../../src/main/agent/a2a/discover', () => ({ discoverA2aAgent: mockDiscover }));
jest.mock('../../../../src/main/agent/a2a/client', () => ({ createA2aClient: mockCreateClient }));

import { connectA2aAgent } from '../../../../src/main/agent/a2a/connect';

const card = {
	name: 'Remote',
	capabilities: { extendedAgentCard: true, extensions: [] },
	supportedInterfaces: [],
	securitySchemes: {},
	securityRequirements: [],
	defaultInputModes: ['text/plain'],
	defaultOutputModes: ['text/plain'],
	skills: [],
};

beforeEach(() => {
	jest.clearAllMocks();
});

it('fetches and revalidates an authenticated extended Agent Card', async () => {
	const extendedCard = { ...card, description: 'Authenticated details' };
	const getAgentCard = jest.fn().mockResolvedValue(extendedCard);
	const initialClient = { getAgentCard };
	const extendedClient = { sendMessage: jest.fn() };
	mockDiscover.mockResolvedValue(card);
	mockCreateClient.mockResolvedValueOnce(initialClient).mockResolvedValueOnce(extendedClient);

	await expect(
		connectA2aAgent('https://agent.example', {
			authType: 'bearer',
			credential: 'secret',
		})
	).resolves.toEqual({ card: extendedCard, client: extendedClient });
	expect(getAgentCard).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
	expect(mockCreateClient).toHaveBeenNthCalledWith(
		2,
		extendedCard,
		expect.objectContaining({ credential: 'secret' }),
		'https://agent.example'
	);
});
