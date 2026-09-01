import { act, render, screen } from '@testing-library/react';
import { ExtensionShell } from '../../../src/renderer/src/components/app/titlebar/ExtensionShell';

jest.mock('../../../src/renderer/src/components/app/titlebar/hooks/useAppTheme', () => ({
	useAppTheme: jest.fn(),
}));

jest.mock('../../../src/renderer/src/components/app/titlebar/ExtensionTitleBar', () => ({
	ExtensionTitleBar: ({ title, sidebarWidth }: { title: string; sidebarWidth: number | null }) => (
		<div data-sidebar-width={sidebarWidth ?? ''} data-testid="extension-titlebar">
			{title}
		</div>
	),
}));

let sidebarWidthChanged: (width: number | null) => void;

beforeEach(() => {
	Object.defineProperty(window, 'win', {
		configurable: true,
		value: {
			onTitlebarSidebarWidthChanged: jest.fn((callback) => {
				sidebarWidthChanged = callback;
				return jest.fn();
			}),
		},
	});
});

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

it('keeps the extension titlebar aligned with its sidebar width', () => {
	render(<ExtensionShell title="Workspace" />);

	act(() => sidebarWidthChanged(240));

	expect(screen.getByTestId('extension-titlebar')).toHaveAttribute('data-sidebar-width', '240');
});
