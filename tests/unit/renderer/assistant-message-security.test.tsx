import { render, screen } from '@testing-library/react';
import { AssistantMessage } from '../../../src/renderer/src/pages/home/components/AssistantMessage';
import type { AgentMessage } from '../../../src/renderer/src/pages/home/context';

jest.mock('@/pages/home/hooks', () => ({
	useReadMessageAloud: () => ({
		speak: jest.fn(),
		isSpeaking: false,
		errorMessage: null,
		clearError: jest.fn(),
	}),
}));

function message(content: string, tools: AgentMessage['tools'] = []): AgentMessage {
	return {
		id: 'assistant-1',
		role: 'agent',
		type: 'agent',
		content,
		state: 'completed',
		tools,
	};
}

it('does not load an arbitrary absolute image path from assistant Markdown', () => {
	render(<AssistantMessage message={message('![private](/Users/alice/private.png)')} />);

	expect(screen.getByRole('img', { name: 'private' })).not.toHaveAttribute('src');
});

it('encodes reserved pathname characters in generated media URLs', () => {
	render(
		<AssistantMessage
			message={message('', [
				{
					toolCallId: 'image-1',
					type: 'create_image',
					state: 'output-available',
					output: { path: '/tmp/generated#draft?.png' },
				},
			])}
		/>
	);

	expect(screen.getByRole('img', { name: 'Generated image' })).toHaveAttribute(
		'src',
		'local-resource://file/tmp/generated%23draft%3F.png'
	);
});
