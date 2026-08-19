const mockDiscover = jest.fn();
const mockCreateFromAgentCard = jest.fn();
const mockClientFactory = jest.fn();

jest.mock('../../../../src/main/agent/a2a/discover', () => ({ discoverA2aAgent: mockDiscover }));
jest.mock('@a2a-js/sdk/client', () => ({ ClientFactory: mockClientFactory }));

import { TaskState } from '@a2a-js/sdk';
import { sendA2aMessage } from '../../../../src/main/agent/a2a/send';
import { setA2aAgents } from '../../../../src/main/agent/a2a/store';

const card = {
	name: 'Remote', description: 'Remote',
	supportedInterfaces: [{ url: 'https://remote.example/a2a', protocolBinding: 'JSONRPC', protocolVersion: '1.0', tenant: '' }],
	capabilities: { streaming: false, extensions: [] }, defaultInputModes: ['text/plain'], defaultOutputModes: ['text/plain'], skills: [],
};

beforeEach(() => {
	setA2aAgents([{ id: 'target', name: 'Remote', url: 'https://remote.example', token: 'secret', enabled: true, skills: [] }]);
	mockDiscover.mockResolvedValue(card);
	mockClientFactory.mockImplementation(() => ({ createFromAgentCard: mockCreateFromAgentCard }));
});

it('prioritizes an exact ID and forwards continuation IDs, credentials, and cancellation', async () => {
	setA2aAgents([
		{ id: 'first', name: 'target', url: 'https://wrong.example', enabled: true, skills: [] },
		{ id: 'target', name: 'Right', url: 'https://right.example', token: 'secret', enabled: true, skills: [] },
	]);
	const sendMessage = jest.fn().mockResolvedValue({ parts: [{ content: { $case: 'text', value: 'done' } }] });
	mockCreateFromAgentCard.mockResolvedValue({ sendMessage });
	const controller = new AbortController();

	await expect(sendA2aMessage('target', 'continue', controller.signal, 'task-1', 'context-1')).resolves.toBe('done');
	expect(mockDiscover).toHaveBeenCalledWith('https://right.example', 'secret', controller.signal);
	expect(sendMessage).toHaveBeenCalledWith(
		expect.objectContaining({ message: expect.objectContaining({ taskId: 'task-1', contextId: 'context-1', role: 1 }) }),
		expect.objectContaining({ signal: controller.signal, serviceParameters: { Authorization: 'Bearer secret' } })
	);
});

it('returns artifacts from a completed initial Task-only stream', async () => {
	mockDiscover.mockResolvedValue({ ...card, capabilities: { streaming: true, extensions: [] } });
	const sendMessageStream = jest.fn(async function* () {
		yield { payload: { $case: 'task', value: { id: 'task-1', contextId: 'context-1', status: { state: TaskState.TASK_STATE_COMPLETED }, artifacts: [{ artifactId: 'answer', parts: [{ content: { $case: 'text', value: 'complete' } }] }] } } };
	});
	mockCreateFromAgentCard.mockResolvedValue({ sendMessageStream });

	await expect(sendA2aMessage('target', 'work')).resolves.toBe('complete');
});

it('honors artifact replacement and append semantics', async () => {
	mockDiscover.mockResolvedValue({ ...card, capabilities: { streaming: true, extensions: [] } });
	const sendMessageStream = jest.fn(async function* () {
		yield { payload: { $case: 'artifactUpdate', value: { taskId: 'task-1', contextId: 'context-1', append: false, artifact: { artifactId: 'answer', parts: [{ content: { $case: 'text', value: 'wrong' } }] } } } };
		yield { payload: { $case: 'artifactUpdate', value: { taskId: 'task-1', contextId: 'context-1', append: false, artifact: { artifactId: 'answer', parts: [{ content: { $case: 'text', value: 'Hel' } }] } } } };
		yield { payload: { $case: 'artifactUpdate', value: { taskId: 'task-1', contextId: 'context-1', append: true, artifact: { artifactId: 'answer', parts: [{ content: { $case: 'text', value: 'lo' } }] } } } };
		yield { payload: { $case: 'statusUpdate', value: { taskId: 'task-1', contextId: 'context-1', status: { state: TaskState.TASK_STATE_COMPLETED } } } };
	});
	mockCreateFromAgentCard.mockResolvedValue({ sendMessageStream });

	await expect(sendA2aMessage('target', 'work')).resolves.toBe('Hello');
});

it('turns terminal failures into tool errors and preserves interrupted task references', async () => {
	const sendMessage = jest.fn()
		.mockResolvedValueOnce({ id: 'failed', contextId: 'ctx', status: { state: TaskState.TASK_STATE_FAILED, message: { parts: [{ content: { $case: 'text', value: 'boom' } }] } }, artifacts: [] })
		.mockResolvedValueOnce({ id: 'input', contextId: 'ctx', status: { state: TaskState.TASK_STATE_INPUT_REQUIRED, message: { parts: [{ content: { $case: 'text', value: 'Which city?' } }] } }, artifacts: [] });
	mockCreateFromAgentCard.mockResolvedValue({ sendMessage });

	await expect(sendA2aMessage('target', 'work')).rejects.toThrow('Remote task failed (context ctx) failed: boom');
	await expect(sendA2aMessage('target', 'work')).resolves.toBe('Remote task input (context ctx) requires input: Which city?');
});

it('uses readable state fallback text instead of numeric enum values', async () => {
	const sendMessage = jest.fn().mockResolvedValue({ id: 'task-1', contextId: 'ctx', status: { state: TaskState.TASK_STATE_COMPLETED }, artifacts: [] });
	mockCreateFromAgentCard.mockResolvedValue({ sendMessage });
	await expect(sendA2aMessage('target', 'work')).resolves.toBe('Remote task task-1 (context ctx) is completed.');
});
