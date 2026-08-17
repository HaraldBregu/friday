import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TitleBar } from '../../../src/renderer/src/components/app/titlebar/TitleBar';
import { SettingsBreadcrumb } from '../../../src/renderer/src/pages/settings/Breadcrumb';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string): string => key }),
}));

jest.mock('@/components/ui/gradient-sphere', () => ({
	GradientSphere: (): null => null,
}));

const showContextMenu = jest.fn();
const contextMenuItems = [
	{ id: '/settings/general', label: 'settings.tabs.general' },
	{ id: '/settings/assistant', label: 'settings.overview.groups.agent' },
	{ id: '/settings/system', label: 'settings.tabs.system' },
	{ id: '/settings/extensions', label: 'settings.tabs.extensions' },
];

beforeEach(() => {
	showContextMenu.mockReset().mockResolvedValue(null);
	Object.defineProperty(window, 'win', {
		configurable: true,
		value: {
			isFullScreen: jest.fn().mockResolvedValue(false),
			onFullScreenChange: jest.fn(() => jest.fn()),
			showContextMenu,
		},
	});
});

it.each([
	['settings.tabs.general', '/settings/general'],
	['settings.overview.groups.agent', '/settings/assistant'],
	['settings.tabs.system', '/settings/system'],
	['settings.tabs.extensions', '/settings/extensions'],
])('opens a native context menu and navigates from %s to %s', async (_label, path) => {
	showContextMenu.mockResolvedValue(path);
	const { container } = render(
		<MemoryRouter initialEntries={['/project']}>
			<TitleBar />
			<Routes>
				<Route path="/project" element={null} />
				<Route path={path} element={<p>{path}</p>} />
			</Routes>
		</MemoryRouter>
	);
	const titleBar = container.querySelector('[data-slot="titlebar"]');

	expect(titleBar).not.toBeNull();
	const contextMenuEvent = new MouseEvent('contextmenu', {
		bubbles: true,
		cancelable: true,
	});
	fireEvent(titleBar as Element, contextMenuEvent);

	expect(contextMenuEvent.defaultPrevented).toBe(true);
		expect(showContextMenu).toHaveBeenCalledWith(contextMenuItems);
	await waitFor(() => expect(screen.getByText(path)).toBeInTheDocument());
});

it('does not open the titlebar menu from a button', () => {
	render(
		<MemoryRouter initialEntries={['/home']}>
			<TitleBar />
		</MemoryRouter>
	);

	fireEvent.contextMenu(screen.getByRole('button', { name: 'settings.title' }));

	expect(showContextMenu).not.toHaveBeenCalled();
});

it.each(['/settings', '/start'])('opens the titlebar menu while viewing %s', (path) => {
	const { container } = render(
		<MemoryRouter initialEntries={[path]}>
			<TitleBar />
		</MemoryRouter>
	);

	fireEvent.contextMenu(container.querySelector('[data-slot="titlebar"]') as Element);

	expect(showContextMenu).toHaveBeenCalledWith(contextMenuItems);
});

it('shows the settings icon on Home', async () => {
	const user = userEvent.setup();

	render(
		<MemoryRouter initialEntries={['/home']}>
			<TitleBar />
			<Routes>
				<Route path="/home" element={null} />
				<Route path="/settings" element={<p>/settings</p>} />
			</Routes>
		</MemoryRouter>
	);

	expect(screen.getByRole('button', { name: 'settings.title' })).toBeInTheDocument();

	await user.click(screen.getByRole('button', { name: 'settings.title' }));

	expect(screen.getByText('/settings')).toBeInTheDocument();
});

it('renders a transparent titlebar without visible title text', () => {
	const { container } = render(
		<MemoryRouter initialEntries={['/home']}>
			<TitleBar />
		</MemoryRouter>
	);
	const titleBar = container.querySelector('[data-slot="titlebar"]');

	expect(titleBar).toHaveClass('bg-transparent');
	expect(titleBar).not.toHaveClass('app-translucent-surface');
	expect(within(titleBar as HTMLElement).queryByText('Application Name')).not.toBeInTheDocument();
});

it('does not render the sidebar toggle in the titlebar', () => {
	render(
		<MemoryRouter initialEntries={['/home']}>
			<TitleBar />
		</MemoryRouter>
	);

	expect(screen.queryByRole('button', { name: 'titleBar.toggleSidebar' })).not.toBeInTheDocument();
});

it('renders settings breadcrumbs inside the titlebar', () => {
	const { container } = render(
		<MemoryRouter initialEntries={['/settings/general/persona']}>
			<TitleBar centerContent={<SettingsBreadcrumb />} />
		</MemoryRouter>
	);
	const titleBar = container.querySelector('[data-slot="titlebar"]');
	const breadcrumb = within(titleBar as HTMLElement).getByRole('navigation', {
		name: 'settings.breadcrumb.label',
	});

	expect(within(breadcrumb).getByRole('link', { name: 'settings.tabs.general' })).toHaveAttribute(
		'href',
		'/settings/general'
	);
	expect(within(breadcrumb).getByText('settings.persona.title')).toBeInTheDocument();
});

it('does not open the titlebar menu from a breadcrumb link', () => {
	const { container } = render(
		<MemoryRouter initialEntries={['/settings/general/persona']}>
			<TitleBar centerContent={<SettingsBreadcrumb />} />
		</MemoryRouter>
	);
	const titleBar = container.querySelector('[data-slot="titlebar"]');
	const breadcrumbLink = within(titleBar as HTMLElement).getByRole('link', {
		name: 'settings.tabs.general',
	});

	fireEvent.contextMenu(breadcrumbLink);
	expect(showContextMenu).not.toHaveBeenCalled();
});
