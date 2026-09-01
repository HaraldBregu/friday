import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CloudPage from '../../../src/renderer/src/pages/settings/pages/cloud/Page';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) =>
			({
				'settings.tabs.cloud': 'Cloud',
				'settings.overview.descriptions.cloud': 'Cloud storage and sync',
				'settings.storage.sync.title': 'Folder Sync',
				'settings.storage.sync.description': 'Configure folder sync.',
				'settings.storage.folders.agent': 'Assistant workspace',
			})[key] ?? key,
	}),
}));

const storageApi = {
	getSettings: jest.fn(),
	saveSettings: jest.fn(),
	syncFolders: jest.fn(),
	pickFolders: jest.fn(),
	getOperationStatus: jest.fn(),
	onOperationStatusChanged: jest.fn(),
	backup: jest.fn(),
	restore: jest.fn(),
};

beforeEach(() => {
	Object.defineProperty(window, 'storage', { configurable: true, value: storageApi });
	storageApi.getSettings.mockResolvedValue({
		paths: [],
		syncEnabled: false,
		syncCronExpression: '0 3 * * *',
	});
	storageApi.syncFolders.mockResolvedValue([{ key: 'agent', path: '/data/agent' }]);
	storageApi.getOperationStatus.mockResolvedValue(undefined);
	storageApi.onOperationStatusChanged.mockReturnValue(jest.fn());
});

it('shows folder controls without provider identity or selection', async () => {
	render(
		<MemoryRouter>
			<CloudPage />
		</MemoryRouter>
	);

	expect(screen.getByRole('heading', { name: 'Cloud' })).toBeInTheDocument();
	expect(await screen.findByRole('switch', { name: 'Assistant workspace' })).toBeVisible();
	expect(screen.queryByText(/provider/i)).not.toBeInTheDocument();
	expect(screen.queryByText(/supabase/i)).not.toBeInTheDocument();
	expect(screen.queryByRole('combobox', { name: /storage to use/i })).not.toBeInTheDocument();
});

it('shows a recoverable error state instead of an endless loading skeleton', async () => {
	storageApi.getSettings.mockRejectedValue(new Error('Storage is offline'));
	const { container } = render(
		<MemoryRouter>
			<CloudPage />
		</MemoryRouter>
	);

	expect(await screen.findByRole('alert')).toHaveTextContent('Storage is offline');
	expect(container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
});
