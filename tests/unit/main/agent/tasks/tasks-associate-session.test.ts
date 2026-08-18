const requireSchedule = jest.fn();
const update = jest.fn();

jest.mock('../../../../../src/main/tasks/tasks_require_schedule', () => ({ requireSchedule }));
jest.mock('../../../../../src/main/tasks/tasks_update', () => ({ update }));

import { associateSession } from '../../../../../src/main/tasks/tasks_associate_session';

beforeEach(() => {
	requireSchedule.mockReset();
	update.mockReset();
});

it('appends a new execution session to the task', () => {
	requireSchedule.mockReturnValue({ id: 'task-1', sessionIds: ['session-1'] });
	update.mockReturnValue({ id: 'task-1', sessionIds: ['session-1', 'session-2'] });

	expect(associateSession('task-1', 'session-2')).toEqual({
		id: 'task-1',
		sessionIds: ['session-1', 'session-2'],
	});
	expect(update).toHaveBeenCalledWith('task-1', {
		sessionIds: ['session-1', 'session-2'],
	});
});

it('supports legacy tasks and does not add duplicate sessions', () => {
	const legacy = { id: 'task-1' };
	requireSchedule.mockReturnValueOnce(legacy);
	update.mockReturnValueOnce({ id: 'task-1', sessionIds: ['session-1'] });
	expect(associateSession('task-1', 'session-1')).toEqual({
		id: 'task-1',
		sessionIds: ['session-1'],
	});

	const current = { id: 'task-1', sessionIds: ['session-1'] };
	requireSchedule.mockReturnValueOnce(current);
	expect(associateSession('task-1', 'session-1')).toBe(current);
	expect(update).toHaveBeenCalledTimes(1);
});
