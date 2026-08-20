import type { CoderApi } from '../shared/api_types';
import { CoderChannels } from '../shared/ipc_channels_definitions';
import { isCoderSettings } from '../shared/coder_types';
import { typedInvokeUnwrap, typedOn } from '../shared/ipc_types';

export const coder: CoderApi = {
	getSettings: () => typedInvokeUnwrap(CoderChannels.getSettings),
	saveSettings: (settings) => {
		if (!isCoderSettings(settings)) throw new Error('Invalid coder settings.');
		return typedInvokeUnwrap(CoderChannels.saveSettings, settings);
	},
	listModels: () => typedInvokeUnwrap(CoderChannels.listModels),
	pickDirectory: () => typedInvokeUnwrap(CoderChannels.pickDirectory),
	send: (prompt, onEvent) => {
		const normalizedPrompt = typeof prompt === 'string' ? prompt.trim() : '';
		if (!normalizedPrompt) throw new Error('Invalid coder prompt.');
		const runId = crypto.randomUUID();
		const unsubscribe = typedOn(CoderChannels.response, (event) => {
			if (event.runId === runId) onEvent?.(event);
		});
		return typedInvokeUnwrap(CoderChannels.send, normalizedPrompt, runId).finally(unsubscribe);
	},
	cancel: (runId) => {
		const normalizedRunId = typeof runId === 'string' ? runId.trim() : '';
		if (!normalizedRunId) throw new Error('Invalid coder run id.');
		return typedInvokeUnwrap(CoderChannels.cancel, normalizedRunId);
	},
	connectCodex: (onEvent) => {
		const unsubscribe = typedOn(CoderChannels.authEvent, (event) => onEvent?.(event));
		return typedInvokeUnwrap(CoderChannels.connectCodex).finally(unsubscribe);
	},
	cancelCodexLogin: () => typedInvokeUnwrap(CoderChannels.cancelCodexLogin),
	disconnectCodex: () => typedInvokeUnwrap(CoderChannels.disconnectCodex),
};
