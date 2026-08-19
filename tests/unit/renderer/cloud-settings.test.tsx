import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CloudPage from '../../../src/renderer/src/pages/settings/pages/cloud/Page';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) =>
			({
				'settings.tabs.cloud': 'Cloud',
				'settings.overview.descriptions.cloud': 'Cloud storage and sync',
				'settings.storage.configurationTitle': 'Object Storage Configuration',
				'settings.storage.description': 'Configure S3-compatible storage providers.',
				'settings.storage.empty': 'No storage providers configured.',
				'settings.storage.configureProvider': 'Configure storage provider',
				'settings.storage.manageProviders': 'Manage providers',
				'settings.storage.cardTitle': 'Object Storage',
				'settings.storage.sync.description': 'Configure folder sync.',
				'settings.storage.profile.label': 'Storage to use',
				'settings.storage.profile.help': 'Choose the storage profile for this backup.',
			})[key] ?? key,
	}),
}));

const storageApi = {
	getStorages: jest.fn(),
	syncFolders: jest.fn(),
	getStorageConfiguration: jest.fn(),
};

beforeEach(() => {
	Object.defineProperty(window, 'storage', { configurable: true, value: storageApi });
	storageApi.getStorages.mockResolvedValue([]);
	storageApi.syncFolders.mockResolvedValue([]);
	storageApi.getStorageConfiguration.mockResolvedValue({
		providerId: '',
		paths: [],
		syncEnabled: false,
		syncCronExpression: '0 3 * * *',
	});
});

it('opens storage provider settings when no provider is configured', async () => {
	const user = userEvent.setup();
	render(
		<MemoryRouter initialEntries={['/settings/cloud']}>
			<Routes>
				<Route path="/settings/cloud" element={<CloudPage />} />
				<Route path="/settings/providers/storage" element={<p>Storage provider settings</p>} />
			</Routes>
		</MemoryRouter>
	);

	expect(screen.getByRole('heading', { name: 'Cloud' })).toBeInTheDocument();
	expect(screen.queryByText('Object Storage Configuration')).not.toBeInTheDocument();
	expect(screen.queryByText('Configure S3-compatible storage providers.')).not.toBeInTheDocument();
	await user.click(await screen.findByRole('button', { name: 'Configure storage provider' }));
	expect(await screen.findByText('Storage provider settings')).toBeInTheDocument();
});

it('shows storage controls without the provider CTA when a provider exists', async () => {
	storageApi.getStorages.mockResolvedValue([
		{
			id: 'backup',
			name: 'Friday backup',
			endpoint: 'https://storage.example.com',
			region: 'us-east-1',
			accessKeyId: 'access',
			secretAccessKey: 'secret',
			bucket: 'friday',
			forcePathStyle: false,
			paths: [],
			syncEnabled: false,
			syncCronExpression: '0 3 * * *',
		},
	]);
	storageApi.getStorageConfiguration.mockResolvedValue({
		providerId: 'backup',
		paths: [],
		syncEnabled: false,
		syncCronExpression: '0 3 * * *',
	});

	render(
		<MemoryRouter>
			<CloudPage />
		</MemoryRouter>
	);

	expect(await screen.findByText('Object Storage')).toBeInTheDocument();
	expect(screen.getByText('Storage to use')).toBeVisible();
	expect(screen.getByRole('button', { name: 'Manage providers' })).toBeVisible();
	expect(
		screen.queryByRole('button', { name: 'Configure storage provider' })
	).not.toBeInTheDocument();
});
