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
	const { container } = render(
		<ExtensionTitleBar title="Workspace" sidebarOpen sidebarWidth={240} />
	);
	const surface = container.querySelector('[data-slot="extension-titlebar-sidebar"]');

	expect(surface).toHaveClass('bg-sidebar', 'border-sidebar-border');
	expect(surface).not.toHaveClass('border-b');
	expect(surface).toHaveClass('transition-transform', 'duration-200');
	expect(surface).toHaveStyle({ width: '240px', transform: 'translateX(0)' });
});

it('slides the full-width sidebar surface off canvas during collapse', () => {
	const { container } = render(
		<ExtensionTitleBar title="Workspace" sidebarOpen={false} sidebarWidth={240} />
	);

	expect(container.querySelector('[data-slot="extension-titlebar-sidebar"]')).toHaveStyle({
		width: '240px',
		transform: 'translateX(-100%)',
	});
});

it('moves centered content with the visible sidebar boundary', () => {
	const { rerender } = render(
		<ExtensionTitleBar title="Workspace" sidebarOpen sidebarWidth={240} />
	);
	const center = screen.getByText('Workspace').parentElement;
	expect(center).toHaveClass('transition-[left]', 'duration-200', 'ease-linear');
	expect(center).toHaveStyle({ left: '240px' });

	rerender(<ExtensionTitleBar title="Workspace" sidebarOpen={false} sidebarWidth={240} />);
	expect(center).toHaveStyle({ left: '0px' });
});

it('catches up to a sidebar transition that started in the extension renderer', () => {
	const { container } = render(
		<ExtensionTitleBar
			title="Workspace"
			sidebarOpen={false}
			sidebarTransitionDelay={-45}
			sidebarWidth={240}
		/>
	);
	const surface = container.querySelector('[data-slot="extension-titlebar-sidebar"]');
	const center = screen.getByText('Workspace').parentElement;

	expect(surface).toHaveStyle({ transitionDelay: '-45ms' });
	expect(center).toHaveStyle({ transitionDelay: '-45ms' });
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
					expanded: true,
				},
			]}
			rightButtons={[{ id: 'settings', label: 'Settings', icon: 'settings' }]}
			sidebarWidth={240}
		/>
	);

	expect(screen.getByText('Workspace')).toBeInTheDocument();
	const sidebar = screen.getByRole('button', { name: 'Collapse sidebar' });
	expect(sidebar).toHaveAttribute('aria-expanded', 'true');
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
