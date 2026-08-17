import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PageContainer, Split } from '../../../src/renderer/src/components/app/base/page';
import { ChatSessionContext } from '../../../src/renderer/src/contexts/chat-session';
import { HomeSidebar } from '../../../src/renderer/src/pages/home/Sidebar';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string): string => key }),
}));

const listSessions = jest.fn();

beforeEach(() => {
	window.localStorage.clear();
	document.documentElement.style.removeProperty('--app-sidebar-width');
	Object.defineProperty(window, 'PointerEvent', {
		configurable: true,
		value: MouseEvent,
	});
	Object.defineProperty(window, 'matchMedia', {
		configurable: true,
		value: jest.fn((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: jest.fn(),
			removeListener: jest.fn(),
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn(),
		})),
	});
	Object.defineProperty(window, 'agent', {
		configurable: true,
		value: { listSessions },
	});
});

it('loads chat history, marks the latest default session, and switches sessions', async () => {
	const user = userEvent.setup();
	const setSessionId = jest.fn();
	listSessions.mockResolvedValue([
		{ id: 'session-latest', title: 'Latest chat', createdAtMs: 2 },
		{ id: 'session-older', title: 'Older chat', createdAtMs: 1 },
	]);

	render(
		<MemoryRouter>
			<ChatSessionContext.Provider value={{ sessionId: 'home', setSessionId }}>
				<PageContainer>
					<HomeSidebar refreshKey="initial" />
				</PageContainer>
			</ChatSessionContext.Provider>
		</MemoryRouter>
	);

	const navigation = await screen.findByRole('navigation', {
		name: 'settings.chatHistory.title',
	});
	const latest = within(navigation).getByRole('button', { name: 'Latest chat' });
	const older = within(navigation).getByRole('button', { name: 'Older chat' });
	expect(latest).toHaveAttribute('aria-current', 'page');

	await user.click(older);
	expect(setSessionId).toHaveBeenCalledWith('session-older');
	expect(screen.getByRole('link', { name: 'settings.title' })).toHaveAttribute(
		'href',
		'/settings'
	);
});

it('starts a new chat from the sidebar', async () => {
	const user = userEvent.setup();
	const setSessionId = jest.fn();
	listSessions.mockResolvedValue([]);
	Object.defineProperty(globalThis.crypto, 'randomUUID', {
		configurable: true,
		value: jest.fn(() => '00000000-0000-4000-8000-000000000001'),
	});

	render(
		<MemoryRouter>
			<ChatSessionContext.Provider value={{ sessionId: 'home', setSessionId }}>
				<PageContainer>
					<HomeSidebar refreshKey="initial" />
				</PageContainer>
			</ChatSessionContext.Provider>
		</MemoryRouter>
	);

	await user.click(screen.getByRole('button', { name: 'titleBar.newChat' }));
	expect(setSessionId).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001');
});

it('shows an empty state when there is no chat history', async () => {
	listSessions.mockResolvedValue([]);

	render(
		<MemoryRouter>
			<ChatSessionContext.Provider value={{ sessionId: 'home', setSessionId: jest.fn() }}>
				<PageContainer>
					<HomeSidebar refreshKey="initial" />
				</PageContainer>
			</ChatSessionContext.Provider>
		</MemoryRouter>
	);

	await waitFor(() => {
		expect(screen.getByText('settings.chatHistory.empty')).toBeInTheDocument();
	});
});

it('resizes the sidebar with keyboard and pointer input and persists the width', async () => {
	listSessions.mockResolvedValue([]);
	const { container } = render(
		<MemoryRouter>
			<ChatSessionContext.Provider value={{ sessionId: 'home', setSessionId: jest.fn() }}>
				<PageContainer>
					<Split sidebar={<HomeSidebar refreshKey="initial" />}>
						<div>Workspace</div>
					</Split>
				</PageContainer>
			</ChatSessionContext.Provider>
		</MemoryRouter>
	);
	const resizer = screen.getByRole('separator', { name: 'Resize sidebar' });
	const toggle = screen.getByRole('button', { name: 'Toggle Sidebar' });
	const wrapper = container.querySelector('[data-slot="split-pane"]');
	const sidebar = container.querySelector('[data-slot="split-pane-sidebar"]');
	await screen.findByText('settings.chatHistory.empty');
	expect(toggle).not.toBeWithinElement(sidebar as HTMLElement);
	expect(toggle).toHaveStyle({ WebkitAppRegion: 'no-drag' });

	fireEvent.keyDown(resizer, { key: 'ArrowRight' });
	expect(resizer).toHaveAttribute('aria-valuenow', '264');
	expect(wrapper).toHaveStyle({ '--split-pane-sidebar-width': '264px' });

	fireEvent.pointerDown(resizer, { button: 0, clientX: 264 });
	fireEvent.pointerMove(window, { clientX: 320 });
	fireEvent.pointerUp(window);

	expect(resizer).toHaveAttribute('aria-valuenow', '320');
	expect(document.documentElement.style.getPropertyValue('--app-sidebar-width')).toBe('320px');
	expect(window.localStorage.getItem('friday_sidebar_width')).toBe('320');

	fireEvent.click(toggle);
	expect(toggle).toHaveAttribute('aria-expanded', 'false');
	expect(sidebar).toHaveAttribute('data-state', 'collapsed');
});
