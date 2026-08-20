import type { CoderApi } from '../shared/api_types';
import { CoderChannels } from '../shared/ipc_channels_definitions';
import { isCoderRunRequest, isCoderSettings } from '../shared/coder_types';
import { typedInvokeUnwrap, typedOn } from '../shared/ipc_types';

export const coder: CoderApi = {
	getSettings: () => typedInvokeUnwrap(CoderChannels.getSettings),
	saveSettings: (settings) => {
		if (!isCoderSettings(settings)) throw new Error('Invalid coder settings.');
		return typedInvokeUnwrap(CoderChannels.saveSettings, settings);
	},
	listModels: () => typedInvokeUnwrap(CoderChannels.listModels),
	pickDirectory: () => typedInvokeUnwrap(CoderChannels.pickDirectory),
	listProjects: () => typedInvokeUnwrap(CoderChannels.listProjects),
	addProject: () => typedInvokeUnwrap(CoderChannels.addProject),
	removeProject: (projectId) => {
		const normalizedProjectId = typeof projectId === 'string' ? projectId.trim() : '';
		if (!normalizedProjectId) throw new Error('Invalid coder project id.');
		return typedInvokeUnwrap(CoderChannels.removeProject, normalizedProjectId);
	},
	listSessions: (projectId) => {
		const normalizedProjectId = typeof projectId === 'string' ? projectId.trim() : '';
		if (!normalizedProjectId) throw new Error('Invalid coder project id.');
		return typedInvokeUnwrap(CoderChannels.listSessions, normalizedProjectId);
	},
	getSession: (projectId, sessionId) => {
		const normalizedProjectId = typeof projectId === 'string' ? projectId.trim() : '';
		const normalizedSessionId = typeof sessionId === 'string' ? sessionId.trim() : '';
		if (!normalizedProjectId || !normalizedSessionId) throw new Error('Invalid coder session.');
		return typedInvokeUnwrap(
			CoderChannels.getSession,
			normalizedProjectId,
			normalizedSessionId
		);
	},
	send: (request, onEvent) => {
		if (!isCoderRunRequest(request)) throw new Error('Invalid coder run request.');
		const normalizedRequest = {
			...request,
			projectId: request.projectId.trim(),
			...(request.sessionId ? { sessionId: request.sessionId.trim() } : {}),
			input: request.input.trim(),
		};
		const runId = crypto.randomUUID();
		const unsubscribe = typedOn(CoderChannels.response, (event) => {
			if (event.runId === runId) onEvent?.(event);
		});
		return typedInvokeUnwrap(CoderChannels.send, normalizedRequest, runId).finally(unsubscribe);
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
