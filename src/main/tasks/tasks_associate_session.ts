import { update } from './tasks_update';
import type { TaskSchedule } from './tasks_types';

export function associateSession(scheduleId: string, sessionId: string): TaskSchedule {
	const schedule = update(scheduleId, {});
	if (!schedule.sessionIds.includes(sessionId)) schedule.sessionIds.push(sessionId);
	return update(scheduleId, { sessionIds: schedule.sessionIds });
}
