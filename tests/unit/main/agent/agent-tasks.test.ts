const mockSetTaskRunner = jest.fn();
const mockStartTask = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../../src/main/shared/agent_location', () => ({
	agentLocation: () => '/tmp/friday-agent-tasks',
}));
jest.mock('../../../../src/main/tasks', () => ({
	initTask: jest.fn(),
	destroyTask: jest.fn(),
	getRuntime: jest.fn(() => ({ providerId: 'task-provider', modelId: 'task-model' })),
	setTaskRunner: (...args: unknown[]) => mockSetTaskRunner(...args),
	startTask: (...args: unknown[]) => mockStartTask(...args),
}));
jest.mock('../../../../src/main/agent/health', () => ({
	startHealth: jest.fn(),
	stopHealth: jest.fn(),
}));
jest.mock('../../../../src/main/agent/permissions', () => ({
	rejectPendingToolPermissions: jest.fn(),
}));

import { Agent } from '../../../../src/main/agent/agent';
import type { ExecSandbox } from '../../../../src/main/agent/sandbox';
import type { TaskRunner, TaskSchedule } from '../../../../src/main/tasks';
import type { WindowFactory } from '../../../../src/main/window_factory';

it('gives scheduled agents the full tool catalog unless a non-empty restriction is saved', async () => {
	const sandbox = { reset: jest.fn() } as unknown as ExecSandbox;
	const agent = new Agent({} as WindowFactory, sandbox);
	const send = jest.spyOn(agent, 'send').mockResolvedValue('done');
	agent.start({ info: jest.fn(), error: jest.fn() });
	const runner = mockSetTaskRunner.mock.calls[0][0] as TaskRunner;
	const schedule = (toolsAllow?: string[]): TaskSchedule => ({
		id: 'schedule-1',
		name: 'Daily task',
		enabled: true,
		action: { type: 'agent', prompt: 'Do the work', effort: 'low', toolsAllow },
		createdAt: '2026-08-11T00:00:00.000Z',
		updatedAt: '2026-08-11T00:00:00.000Z',
	});

	await runner(schedule());
	await runner(schedule([]));
	await runner(schedule(['read', 'bash']));

	for (const call of send.mock.calls.slice(0, 2)) {
		expect(call).toEqual([
			'Do the work',
			'tasks',
			{
				type: 'background',
				streaming: false,
				contextMode: 'minimal',
				effort: 'low',
				providerId: 'task-provider',
				modelId: 'task-model',
			},
		]);
	}
	expect(send.mock.calls[2]).toEqual([
		'Do the work',
		'tasks',
		{
			type: 'background',
			toolsAllow: ['read', 'bash'],
			streaming: false,
			contextMode: 'minimal',
			effort: 'low',
			providerId: 'task-provider',
			modelId: 'task-model',
		},
	]);

	agent.destroy();
});
