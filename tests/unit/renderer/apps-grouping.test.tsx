import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolActivityGroup } from '../../../src/renderer/src/pages/home/components/ToolActivityGroup';
import type { AgentToolPart } from '../../../src/renderer/src/pages/home/context';

it('groups extension tools under one collapsible activity', async () => {
	const user = userEvent.setup();
	const tools = [
		{ type: 'list_extensions', state: 'output-available', toolCallId: 'list' },
		{ type: 'open_extensions', state: 'output-available', toolCallId: 'open' },
		{ type: 'close_extensions', state: 'output-available', toolCallId: 'close' },
	] satisfies AgentToolPart[];

	render(<ToolActivityGroup tools={tools} />);

	await user.click(screen.getByRole('button', { name: 'Extensions' }));
	expect(screen.getByRole('button', { name: /List extensions/ })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /Open extensions/ })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /Close extensions/ })).toBeInTheDocument();
});
