import type { EventBus } from '../event_bus';
import { TaskChannels } from '../../shared/ipc_channels_definitions';
import {
	configureScheduleCapabilities,
	getRuntime,
	listSchedules,
	runScheduleNow,
	setRuntime,
} from '../tasks';
import { registerCommand, registerQuery } from './core/gateway';
import type { IpcModule } from './core/module';

export class TaskIpc implements IpcModule {
	readonly name = 'tasks';

	register(_deps: void, _eventBus: EventBus): void {
		registerQuery(TaskChannels.list, () => listSchedules());
		registerCommand(TaskChannels.runNow, (scheduleId: string) => {
			if (typeof scheduleId !== 'string') throw new Error('Invalid task schedule id.');
			return runScheduleNow(scheduleId);
		});
		registerQuery(TaskChannels.getRuntime, () => getRuntime());
		registerCommand(TaskChannels.setRuntime, (providerId: string, modelId: string) => {
			return setRuntime(providerId, modelId);
		});
		registerCommand(
			TaskChannels.configureCapabilities,
			(scheduleId: string, enabled: boolean, toolsAllow: string[]) => {
				if (typeof scheduleId !== 'string' || typeof enabled !== 'boolean' || !Array.isArray(toolsAllow))
					throw new Error('Invalid schedule capability configuration.');
				return configureScheduleCapabilities(scheduleId, enabled, toolsAllow);
			}
		);
	}
}
