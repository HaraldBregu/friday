import { fireEvent, render, screen } from '@testing-library/react';
import { ExtensionTitleBar } from '../../../src/renderer/src/components/app/titlebar/ExtensionTitleBar';

jest.mock(
	'../../../src/renderer/src/components/app/titlebar/hooks/useExtensionWindowState',
	() => ({ useExtensionWindowState: jest.fn(() => false) })
);

beforeEach(() => {
	Object.defineProperty(window, 'win', {
		configurable: true,
		value: {
			clickTitlebarButton: jest.fn(),
			minimize: jest.fn(),
			maximize: jest.fn(),
			close: jest.fn(),
			popupMenu: jest.fn(),
		},
	});
});

it('continues the extension sidebar surface through the titlebar', () => {
	const { container } = render(<ExtensionTitleBar title="Workspace" sidebarWidth={240} />);
	const surface = container.querySelector('[data-slot="extension-titlebar-sidebar"]');

	expect(surface).toHaveClass('bg-sidebar', 'border-sidebar-border/50');
	expect(surface).toHaveClass('transition-[width]', 'duration-200');
	expect(surface).toHaveStyle({ width: '240px' });
});

it('keeps the sidebar surface mounted at zero width during collapse', () => {
	const { container } = render(<ExtensionTitleBar title="Workspace" sidebarWidth={0} />);

	expect(container.querySelector('[data-slot="extension-titlebar-sidebar"]')).toHaveStyle({
		width: '0px',
	});
});

it('renders centered titlebar content and relays left and right button ids', () => {
	render(
		<ExtensionTitleBar
			title="Workspace"
			leftButtons={[
				{
					id: 'toggle-sidebar',
					label: 'Collapse sidebar',
					icon: 'panel-left',
					pressed: true,
				},
			]}
			rightButtons={[{ id: 'settings', label: 'Settings', icon: 'settings' }]}
			sidebarWidth={240}
		/>
	);

	expect(screen.getByText('Workspace')).toBeInTheDocument();
	const sidebar = screen.getByRole('button', { name: 'Collapse sidebar' });
	expect(sidebar).toHaveAttribute('aria-pressed', 'true');
	fireEvent.click(sidebar);
	fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
	expect(window.win.clickTitlebarButton).toHaveBeenNthCalledWith(1, 'toggle-sidebar');
	expect(window.win.clickTitlebarButton).toHaveBeenNthCalledWith(2, 'settings');
});

it('does not dispatch disabled titlebar buttons', () => {
	render(
		<ExtensionTitleBar
			title="Workspace"
			rightButtons={[
				{ id: 'settings', label: 'Settings', icon: 'settings', disabled: true },
			]}
		/>
	);

	fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
	expect(window.win.clickTitlebarButton).not.toHaveBeenCalled();
});
