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
