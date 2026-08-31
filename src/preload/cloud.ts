import type { CloudApi } from '../shared/cloud_types';
import { CloudChannels } from '../shared/ipc_channels_definitions';
import { typedInvokeUnwrap, typedOn } from '../shared/ipc_types';

export const cloud: CloudApi = {
	listSessions: () => typedInvokeUnwrap(CloudChannels.listSessions),
	upsertSession: (input) => typedInvokeUnwrap(CloudChannels.upsertSession, input),
	deleteSession: (sessionId) => typedInvokeUnwrap(CloudChannels.deleteSession, sessionId),
	listMessages: (sessionId) => typedInvokeUnwrap(CloudChannels.listMessages, sessionId),
	upsertMessage: (input) => typedInvokeUnwrap(CloudChannels.upsertMessage, input),
	uploadFile: (input) => typedInvokeUnwrap(CloudChannels.uploadFile, input),
	downloadFile: (fileId) => typedInvokeUnwrap(CloudChannels.downloadFile, fileId),
	deleteFile: (fileId) => typedInvokeUnwrap(CloudChannels.deleteFile, fileId),
	watchSession: (sessionId) => typedInvokeUnwrap(CloudChannels.watchSession, sessionId),
	unwatchSession: (sessionId) => typedInvokeUnwrap(CloudChannels.unwatchSession, sessionId),
	onSessionChanged: (callback) => typedOn(CloudChannels.sessionChanged, callback),
};
