import { typedInvokeUnwrap } from '../shared/ipc_types';
import { AppsChannels } from '../shared/ipc_channels_definitions';
import type { AppsApi } from './index.d';

export const apps: AppsApi = {
	list: () => {
		return typedInvokeUnwrap(AppsChannels.list);
	},
	open: (appId) => {
		return typedInvokeUnwrap(AppsChannels.open, appId);
	},
	openRoot: () => {
		return typedInvokeUnwrap(AppsChannels.openRoot);
	},
	delete: (appId) => {
		return typedInvokeUnwrap(AppsChannels.delete, appId);
	},
	import: () => {
		return typedInvokeUnwrap(AppsChannels.import);
	},
};
