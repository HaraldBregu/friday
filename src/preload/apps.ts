import { typedInvokeUnwrap } from '../shared/ipc_types';
import { ExtensionChannels } from '../shared/ipc_channels_definitions';
import type { ExtensionsApi } from './index.d';

export const extensions: ExtensionsApi = {
	list: () => {
		return typedInvokeUnwrap(ExtensionChannels.list);
	},
	open: (extensionId) => {
		return typedInvokeUnwrap(ExtensionChannels.open, extensionId);
	},
	openRoot: () => {
		return typedInvokeUnwrap(ExtensionChannels.openRoot);
	},
	delete: (extensionId) => {
		return typedInvokeUnwrap(ExtensionChannels.delete, extensionId);
	},
	import: () => {
		return typedInvokeUnwrap(ExtensionChannels.import);
	},
};
