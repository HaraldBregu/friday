import { TerminalChannels } from '../shared/ipc_channels_definitions';
import { typedInvokeUnwrap, typedOn, typedSend } from '../shared/ipc_types';
import type { TerminalApi } from '../shared/terminal';

export const terminalAPI: TerminalApi = {
	create: (request) => typedInvokeUnwrap(TerminalChannels.create, request),
	write: (request) => typedSend(TerminalChannels.write, request),
	resize: (request) => typedSend(TerminalChannels.resize, request),
	kill: (request) => typedInvokeUnwrap(TerminalChannels.kill, request),
	onData: (callback) => typedOn(TerminalChannels.data, callback),
	onExit: (callback) => typedOn(TerminalChannels.exit, callback),
};
