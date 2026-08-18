import { typedInvokeUnwrap } from '../shared/ipc_types';
import { TaskChannels } from '../shared/ipc_channels_definitions';
import type { TaskApi } from './index.d';

export const tasks: TaskApi = {
	list: () => {
		return typedInvokeUnwrap(TaskChannels.list);
	},
	runNow: (scheduleId: string) => {
		return typedInvokeUnwrap(TaskChannels.runNow, scheduleId);
	},
	delete: (scheduleId: string) => {
		return typedInvokeUnwrap(TaskChannels.delete, scheduleId);
	},
	getRuntime: () => {
		return typedInvokeUnwrap(TaskChannels.getRuntime);
	},
	setRuntime: (providerId: string, modelId: string) => {
		return typedInvokeUnwrap(TaskChannels.setRuntime, providerId, modelId);
	},
	configureCapabilities: (scheduleId: string, enabled: boolean, toolsAllow: string[]) => {
		return typedInvokeUnwrap(
			TaskChannels.configureCapabilities,
			scheduleId,
			enabled,
			toolsAllow
		);
	},
};
