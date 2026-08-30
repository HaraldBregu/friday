import { agentChatReducer } from '../../../src/renderer/src/pages/home/context/reducer';
import type { AgentChatState, AgentMessage } from '../../../src/renderer/src/pages/home/context/state';

it('settles a tool still shown as running when its agent run completes', () => {
	const message: AgentMessage = {
		id: 'agent-1',
		role: 'agent',
		type: 'agent',
		content: '',
		runId: 'run-1',
		state: 'using_tools',
		tools: [
			{
				toolCallId: 'tool-1',
				type: 'read',
				state: 'input-available',
				input: { path: 'README.md' },
			},
		],
	};
	const state: AgentChatState = {
		messages: [message],
		activeAgentId: message.id,
		activeRunId: message.runId,
	};

	const completed = agentChatReducer(state, {
		type: 'complete_active',
		response: 'Done',
		completedAtMs: 100,
	});
	const completedMessage = completed.messages[0] as AgentMessage;

	expect(completedMessage.state).toBe('completed');
	expect(completedMessage.tools[0].state).toBe('output-available');
});

it('stops a running tool when its agent run is cancelled', () => {
	const message: AgentMessage = {
		id: 'agent-1',
		role: 'agent',
		type: 'agent',
		content: '',
		runId: 'run-1',
		state: 'using_tools',
		tools: [
			{
				toolCallId: 'image-1',
				type: 'create_image',
				state: 'input-available',
				input: { prompt: 'A mountain' },
			},
		],
	};
	const state: AgentChatState = {
		messages: [message],
		activeAgentId: message.id,
		activeRunId: message.runId,
	};

	const cancelled = agentChatReducer(state, {
		type: 'cancel_active',
		completedAtMs: 100,
	});
	const cancelledMessage = cancelled.messages[0] as AgentMessage;

	expect(cancelledMessage.tools[0]).toMatchObject({
		state: 'output-error',
		status: 'error',
	});
});

it('stops a running tool when its agent run fails', () => {
	const message: AgentMessage = {
		id: 'agent-1',
		role: 'agent',
		type: 'agent',
		content: '',
		runId: 'run-1',
		state: 'using_tools',
		tools: [
			{
				toolCallId: 'image-1',
				type: 'create_image',
				state: 'input-available',
				input: { prompt: 'A mountain' },
			},
		],
	};
	const state: AgentChatState = {
		messages: [message],
		activeAgentId: message.id,
		activeRunId: message.runId,
	};

	const failed = agentChatReducer(state, {
		type: 'error_active',
		errorText: 'Image generation failed.',
		completedAtMs: 100,
	});
	const failedMessage = failed.messages[0] as AgentMessage;

	expect(failedMessage.tools[0]).toMatchObject({
		state: 'output-error',
		status: 'error',
	});
});
