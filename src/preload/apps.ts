import { typedInvokeUnwrap } from '../shared/ipc_types';
import { AppChannels } from '../shared/ipc_channels_definitions';
import type { AppsApi } from './index.d';

export const apps: AppsApi = {
	list: () => {
		return typedInvokeUnwrap(AppChannels.list);
	},
	open: (appId) => {
		return typedInvokeUnwrap(AppChannels.open, appId);
	},
	openRoot: () => {
		return typedInvokeUnwrap(AppChannels.openRoot);
	},
	delete: (appId) => {
		return typedInvokeUnwrap(AppChannels.delete, appId);
	},
	import: () => {
		return typedInvokeUnwrap(AppChannels.import);
	},
};
