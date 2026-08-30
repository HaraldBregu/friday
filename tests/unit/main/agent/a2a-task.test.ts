const mockConnect = jest.fn();
const mockResolve = jest.fn();

jest.mock('../../../../src/main/agent/a2a/connect', () => ({ connectA2aAgent: mockConnect }));
jest.mock('../../../../src/main/agent/a2a/remote', () => ({ resolveA2aAgent: mockResolve }));
jest.mock('@a2a-js/sdk', () => ({
	TaskState: {
		TASK_STATE_COMPLETED: 3,
		TASK_STATE_FAILED: 4,
		TASK_STATE_CANCELED: 5,
		TASK_STATE_INPUT_REQUIRED: 6,
		TASK_STATE_REJECTED: 7,
		TASK_STATE_AUTH_REQUIRED: 8,
	},
	taskStateToJSON: (state: number) =>
		({ 3: 'TASK_STATE_COMPLETED', 4: 'TASK_STATE_FAILED', 5: 'TASK_STATE_CANCELED' })[state] ??
		'TASK_STATE_WORKING',
}));

import { TaskState } from '@a2a-js/sdk';
import { cancelA2aTask } from '../../../../src/main/agent/a2a/cancel';
import { getA2aTask } from '../../../../src/main/agent/a2a/get';

const remote = {
	id: 'agent',
	name: 'Agent',
	url: 'https://agent.example',
	authType: 'bearer' as const,
	credential: 'secret',
	enabled: true,
	skills: [],
};

beforeEach(() => {
	mockResolve.mockReturnValue(remote);
});

it('reports failed task state without turning a successful Get Task call into an error', async () => {
	const getTask = jest.fn().mockResolvedValue({
		id: 'task-1',
		contextId: 'ctx',
		status: {
			state: TaskState.TASK_STATE_FAILED,
			message: { parts: [{ content: { $case: 'text', value: 'failed safely' } }] },
		},
		artifacts: [],
	});
	mockConnect.mockResolvedValue({ client: { getTask } });
	const controller = new AbortController();
	await expect(getA2aTask('agent', 'task-1', controller.signal)).resolves.toBe(
		'Remote task task-1 (context ctx) is failed: failed safely'
	);
	expect(getTask).toHaveBeenCalledWith(
		{ tenant: '', id: 'task-1', historyLength: 0 },
		{ signal: controller.signal }
	);
});

it('reports a successful canceled Task from Cancel Task', async () => {
	const cancelTask = jest.fn().mockResolvedValue({
		id: 'task-1',
		contextId: 'ctx',
		status: { state: TaskState.TASK_STATE_CANCELED },
		artifacts: [],
	});
	mockConnect.mockResolvedValue({ client: { cancelTask } });
	await expect(cancelA2aTask('agent', 'task-1')).resolves.toBe(
		'Remote task task-1 (context ctx) is canceled.'
	);
	expect(cancelTask).toHaveBeenCalledWith(
		{ tenant: '', id: 'task-1', metadata: undefined },
		{ signal: expect.any(AbortSignal) }
	);
});
