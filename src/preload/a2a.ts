import type { A2aApi } from '../shared/a2a_types';
import { A2aChannels } from '../shared/ipc_channels_definitions';
import { typedInvokeUnwrap } from '../shared/ipc_types';

export const a2a: A2aApi = {
	list: () => typedInvokeUnwrap(A2aChannels.list),
	save: (input) => typedInvokeUnwrap(A2aChannels.save, input),
	delete: (id) => typedInvokeUnwrap(A2aChannels.delete, id),
	test: (input) => typedInvokeUnwrap(A2aChannels.test, input),
};
