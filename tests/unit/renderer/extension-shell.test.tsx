import { act, render, screen } from '@testing-library/react';
import { ExtensionShell } from '../../../src/renderer/src/components/app/titlebar/ExtensionShell';

jest.mock('../../../src/renderer/src/components/app/titlebar/hooks/useAppTheme', () => ({
	useAppTheme: jest.fn(),
}));

jest.mock('../../../src/renderer/src/components/app/titlebar/ExtensionTitleBar', () => ({
	ExtensionTitleBar: ({
		title,
		leftButtons,
		rightButtons,
		sidebarWidth,
	}: {
		title: string;
		leftButtons: Array<{ id: string }>;
		rightButtons: Array<{ id: string }>;
		sidebarWidth: number | null;
	}) => (
		<div
			data-sidebar-width={sidebarWidth ?? ''}
			data-left-buttons={leftButtons.map((button) => button.id).join(',')}
			data-right-buttons={rightButtons.map((button) => button.id).join(',')}
			data-testid="extension-titlebar"
		>
			{title}
		</div>
	),
}));

let sidebarWidthChanged: (width: number | null) => void;
let titlebarOptionsChanged: (options: {
	title?: string;
	leftButtons?: Array<{ id: string }>;
	rightButtons?: Array<{ id: string }>;
	sidebarWidth?: number | null;
} | null) => void;
const stopOptions = jest.fn();
const stopSidebarWidth = jest.fn();

beforeEach(() => {
	stopOptions.mockClear();
	stopSidebarWidth.mockClear();
	Object.defineProperty(window, 'win', {
		configurable: true,
		value: {
			onTitlebarSidebarWidthChanged: jest.fn((callback) => {
				sidebarWidthChanged = callback;
				return stopSidebarWidth;
			}),
			onTitlebarOptionsChanged: jest.fn((callback) => {
				titlebarOptionsChanged = callback;
				return stopOptions;
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

it('renders the extension title, buttons, and animated sidebar width from one snapshot', () => {
	render(<ExtensionShell title="Manifest title" />);

	act(() =>
		titlebarOptionsChanged({
			title: 'Workspace',
			leftButtons: [{ id: 'toggle-sidebar' }],
			rightButtons: [{ id: 'settings' }],
			sidebarWidth: 0,
		})
	);

	const titlebar = screen.getByTestId('extension-titlebar');
	expect(titlebar).toHaveTextContent('Workspace');
	expect(titlebar).toHaveAttribute('data-left-buttons', 'toggle-sidebar');
	expect(titlebar).toHaveAttribute('data-right-buttons', 'settings');
	expect(titlebar).toHaveAttribute('data-sidebar-width', '0');
});

it('restores manifest defaults and unsubscribes when the shell unmounts', () => {
	const { unmount } = render(<ExtensionShell title="Manifest title" />);

	act(() => titlebarOptionsChanged({ title: 'Configured title' }));
	act(() => titlebarOptionsChanged(null));
	expect(screen.getByTestId('extension-titlebar')).toHaveTextContent('Manifest title');

	unmount();
	expect(stopOptions).toHaveBeenCalledTimes(1);
	expect(stopSidebarWidth).toHaveBeenCalledTimes(1);
});
