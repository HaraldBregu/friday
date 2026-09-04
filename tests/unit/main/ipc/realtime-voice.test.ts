const registerCommandWithEvent = jest.fn();

jest.mock('../../../../src/main/ipc/core/gateway', () => ({ registerCommandWithEvent }));

import { BrowserWindow } from 'electron';
import { RealtimeVoiceIpc } from '../../../../src/main/ipc/realtime_voice';
import { RealtimeVoiceChannels } from '../../../../src/shared/ipc_channels_definitions';

function command(channel: string): (...args: unknown[]) => unknown {
	return registerCommandWithEvent.mock.calls.find(([registered]) => registered === channel)?.[1];
}

it('routes realtime voice lifecycle commands through the invoking window owner', async () => {
	const execute = jest.fn(async () => undefined);
	const mainFrame = {};
	const sender = { mainFrame };
	const dependencies = {
		conversation: { execute } as never,
		windows: { has: () => true } as never,
		apps: { has: () => false } as never,
	};
	jest
		.mocked(BrowserWindow.fromWebContents)
		.mockReturnValue({ id: 42, webContents: sender, isDestroyed: () => false } as never);
	new RealtimeVoiceIpc().register(dependencies, {} as never);
	const event = { sender, senderFrame: mainFrame };

	await command(RealtimeVoiceChannels.startSession)(event, { chatSessionId: 'chat' });
	await command(RealtimeVoiceChannels.appendAudio)(event, 'voice', 'AAAA');
	await command(RealtimeVoiceChannels.interruptSession)(event, 'voice');
	await command(RealtimeVoiceChannels.stopSession)(event, 'voice');

	expect(execute).toHaveBeenNthCalledWith(1, {
		type: 'voice',
		action: 'start',
		windowId: 42,
		request: { chatSessionId: 'chat' },
	});
	expect(execute).toHaveBeenNthCalledWith(2, {
		type: 'voice',
		action: 'append-audio',
		windowId: 42,
		sessionId: 'voice',
		audio: 'AAAA',
	});
	expect(execute).toHaveBeenNthCalledWith(3, {
		type: 'voice',
		action: 'interrupt',
		windowId: 42,
		sessionId: 'voice',
	});
	expect(execute).toHaveBeenNthCalledWith(4, {
		type: 'voice',
		action: 'stop',
		windowId: 42,
		sessionId: 'voice',
	});
});
