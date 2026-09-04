import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolActivityGroup } from '../../../src/renderer/src/pages/home/components/ToolActivityGroup';
import type { AgentToolPart } from '../../../src/renderer/src/pages/home/context';

it('groups app tools under one collapsible activity', async () => {
	const user = userEvent.setup();
	const tools = [
		{ type: 'list_apps', state: 'output-available', toolCallId: 'list' },
		{ type: 'open_apps', state: 'output-available', toolCallId: 'open' },
		{ type: 'close_apps', state: 'output-available', toolCallId: 'close' },
	] satisfies AgentToolPart[];

	render(<ToolActivityGroup tools={tools} />);

	await user.click(screen.getByRole('button', { name: 'Apps' }));
	expect(screen.getByRole('button', { name: /List apps/ })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /Open apps/ })).toBeInTheDocument();
	expect(screen.getByRole('button', { name: /Close apps/ })).toBeInTheDocument();
});
