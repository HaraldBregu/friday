import type { AgentHistoryMessage } from '../../../src/shared/agent_types';
import { historyToChatMessages } from '../../../src/renderer/src/pages/home/context';

it('restores an unresolved structured input call as interrupted', () => {
	const history: AgentHistoryMessage[] = [
		{
			role: 'assistant',
			content: '',
			contentBlocks: [
				{
					type: 'tool_use',
					toolUseId: 'question',
					toolName: 'ask',
					toolArgs: {
						questions: [
							{
								id: 'scope',
								header: 'Scope',
								question: 'Which scope?',
								options: [],
							},
						],
					},
				},
			],
		},
	];
	const message = historyToChatMessages(history)[0];
	expect(message?.role).toBe('agent');
	if (!message || message.role !== 'agent') throw new Error('Expected restored assistant.');
	expect(message.tools[0]).toMatchObject({
		type: 'ask',
		state: 'output-error',
		output: { status: 'interrupted', answers: [] },
	});
});

it('does not render persisted attachment metadata in the thread', () => {
	const history: AgentHistoryMessage[] = [
		{
			role: 'user',
			content: '',
			contentBlocks: [
				{
					type: 'attachment',
					kind: 'document',
					name: 'brief.pdf',
					mimeType: 'application/pdf',
					bytes: 1234,
				},
			],
		},
	];
	const message = historyToChatMessages(history)[0];
	expect(message).toBeUndefined();
	expect(JSON.stringify(historyToChatMessages(history))).not.toContain('brief.pdf');
});
