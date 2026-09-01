import { render, screen } from '@testing-library/react';
import { ExtensionShell } from '../../../src/renderer/src/components/app/titlebar/ExtensionShell';

jest.mock('../../../src/renderer/src/components/app/titlebar/hooks/useAppTheme', () => ({
	useAppTheme: jest.fn(),
}));

jest.mock('../../../src/renderer/src/components/app/titlebar/ExtensionTitleBar', () => ({
	ExtensionTitleBar: ({ title }: { title: string }) => (
		<div data-testid="extension-titlebar">{title}</div>
	),
}));

it('paints the extension titlebar over the main translucent window surface', () => {
	render(<ExtensionShell title="Workspace" />);

	const shell = screen.getByTestId('extension-titlebar').parentElement;
	expect(shell).toHaveClass(
		'app-translucent-window',
		'h-full',
		'overflow-hidden',
		'bg-background',
		'text-foreground'
	);
	expect(shell).toHaveTextContent('Workspace');
});
