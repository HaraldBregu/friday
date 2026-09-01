import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OverviewPage from '../../../src/renderer/src/pages/settings/pages/overview/Page';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string): string => key }),
}));

it('lists MCP once under the assistant group', () => {
	render(
		<MemoryRouter initialEntries={['/settings']}>
			<OverviewPage />
		</MemoryRouter>
	);

	const assistantGroup = screen.getByText('settings.overview.groups.assistant').closest('section');
	expect(assistantGroup).not.toBeNull();
	expect(within(assistantGroup as HTMLElement).getByText('settings.tabs.mcp')).toBeInTheDocument();
	expect(screen.getAllByText('settings.tabs.mcp')).toHaveLength(1);
});

it('lists Coder under the assistant group', () => {
	render(
		<MemoryRouter initialEntries={['/settings']}>
			<OverviewPage />
		</MemoryRouter>
	);

	const assistantGroup = screen.getByText('settings.overview.groups.assistant').closest('section');
	expect(assistantGroup).not.toBeNull();
	expect(
		within(assistantGroup as HTMLElement).getByRole('button', { name: /settings\.coder\.title/ })
	).toBeInTheDocument();
});

it('uses the assistant title UI for the providers title', () => {
	render(
		<MemoryRouter initialEntries={['/settings']}>
			<OverviewPage />
		</MemoryRouter>
	);

	const assistantTitle = screen.getByRole('heading', {
		name: 'settings.overview.groups.assistant',
	});
	const providersTitle = screen.getByRole('heading', { name: 'settings.tabs.providers' });
	expect(providersTitle.tagName).toBe(assistantTitle.tagName);
	expect(providersTitle.className).toBe(assistantTitle.className);
});

it('keeps object storage out of the providers group', () => {
	render(
		<MemoryRouter initialEntries={['/settings']}>
			<OverviewPage />
		</MemoryRouter>
	);

	const providersGroup = screen.getByText('settings.tabs.providers').closest('section');
	expect(providersGroup).not.toBeNull();
	expect(within(providersGroup as HTMLElement).queryByText('settings.tabs.storage')).toBeNull();
	expect(within(providersGroup as HTMLElement).queryByText('settings.tabs.databases')).toBeNull();
	expect(screen.getByRole('button', { name: /settings\.tabs\.cloud/ })).toBeInTheDocument();
});

it('lists Channels once outside the providers group', () => {
	render(
		<MemoryRouter initialEntries={['/settings']}>
			<OverviewPage />
		</MemoryRouter>
	);

	const providersGroup = screen.getByText('settings.tabs.providers').closest('section');
	expect(providersGroup).not.toBeNull();
	expect(within(providersGroup as HTMLElement).queryByText('settings.tabs.channels')).toBeNull();
	const channelsGroup = screen.getByText('settings.tabs.channels').closest('section');
	expect(channelsGroup).not.toBeNull();
	expect(within(channelsGroup as HTMLElement).getAllByRole('button')).toHaveLength(1);
	expect(screen.getAllByText('settings.tabs.channels')).toHaveLength(1);
});

it('keeps Agent knowledge pages off the overview', () => {
	render(
		<MemoryRouter initialEntries={['/settings']}>
			<OverviewPage />
		</MemoryRouter>
	);

	expect(screen.queryByRole('button', { name: /settings\.rag\.title/ })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: /settings\.wiki\.title/ })).not.toBeInTheDocument();
});

it('uses the Background tasks label on the overview', () => {
	render(
		<MemoryRouter initialEntries={['/settings']}>
			<OverviewPage />
		</MemoryRouter>
	);

	expect(screen.getByRole('button', { name: /settings\.tabs\.taskScheduler/ })).toHaveTextContent(
		'settings.tabs.taskScheduler'
	);
});

it('keeps module toggles off the overview', () => {
	render(
		<MemoryRouter initialEntries={['/settings']}>
			<OverviewPage />
		</MemoryRouter>
	);

	expect(screen.queryByRole('switch')).not.toBeInTheDocument();
});
