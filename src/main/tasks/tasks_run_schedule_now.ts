import { fire } from './tasks_fire';
import type { TaskScheduledTask } from './tasks_types';

export function runScheduleNow(scheduleId: string): TaskScheduledTask {
	const task = fire(scheduleId);
	if (!task) throw new Error(`Task schedule not found: ${scheduleId}`);
	return task;
}
