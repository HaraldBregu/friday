import type { EventBus } from '../event_bus';
import type { ExtensionRegistry } from '../extensions/extension_registry';
import type { WindowContextManager } from '../window_context';
import { TaskChannels } from '../../shared/ipc_channels_definitions';
import {
	configureScheduleCapabilities,
	deleteSchedule,
	getRuntime,
	listSchedules,
	runScheduleNow,
	setRuntime,
} from '../tasks';
import { registerCommandWithEvent, registerQueryWithEvent } from './core/gateway';
import type { IpcModule } from './core/module';
import { TrustedRenderer } from './core/trusted';

export interface TaskIpcDependencies {
	windows: WindowContextManager;
	extensions: ExtensionRegistry;
}

export class TaskIpc implements IpcModule<TaskIpcDependencies> {
	readonly name = 'tasks';

	register({ windows, extensions }: TaskIpcDependencies, _eventBus: EventBus): void {
		const trusted = new TrustedRenderer(windows, extensions);
		registerQueryWithEvent(TaskChannels.list, (event) => {
			trusted.assert(event);
			return listSchedules();
		});
		registerCommandWithEvent(TaskChannels.runNow, (event, scheduleId: string) => {
			trusted.assert(event);
			if (typeof scheduleId !== 'string') throw new Error('Invalid task schedule id.');
			return runScheduleNow(scheduleId);
		});
		registerCommandWithEvent(TaskChannels.delete, (event, scheduleId: string) => {
			trusted.assert(event);
			if (typeof scheduleId !== 'string') throw new Error('Invalid task schedule id.');
			return deleteSchedule(scheduleId);
		});
		registerQueryWithEvent(TaskChannels.getRuntime, (event) => {
			trusted.assert(event);
			return getRuntime();
		});
		registerCommandWithEvent(TaskChannels.setRuntime, (event, providerId: string, modelId: string) => {
			trusted.assert(event);
			return setRuntime(providerId, modelId);
		});
		registerCommandWithEvent(
			TaskChannels.configureCapabilities,
			(event, scheduleId: string, enabled: boolean, toolsAllow: string[]) => {
				trusted.assert(event);
				if (typeof scheduleId !== 'string' || typeof enabled !== 'boolean' || !Array.isArray(toolsAllow))
					throw new Error('Invalid schedule capability configuration.');
				return configureScheduleCapabilities(scheduleId, enabled, toolsAllow);
			}
		);
	}
}
