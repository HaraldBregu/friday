import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProviderCard } from '../../../src/renderer/src/pages/settings/pages/storage/ProviderCard';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string): string => key }),
}));

const storageApi = {
	saveStorageConfig: jest.fn(),
	deleteStorageConfig: jest.fn(),
	testConnection: jest.fn(),
};

beforeEach(() => {
	Object.defineProperty(window, 'storage', { configurable: true, value: storageApi });
});

it('uses the catalog provider icon for a built-in storage provider', () => {
	const { container } = render(
		<ProviderCard
			storage={{
				id: 'cloudflare',
				name: 'Cloudflare',
				endpoint: 'https://r2.cloudflarestorage.com',
				region: 'us-east-1',
				accessKeyId: '',
				secretAccessKey: '',
				bucket: '',
				forcePathStyle: false,
				paths: [],
				syncEnabled: false,
				syncCronExpression: '0 3 * * *',
			}}
			provider={{
				id: 'cloudflare',
				name: 'Cloudflare',
				baseUrl: 'https://r2.cloudflarestorage.com',
				iconDarkUrl: 'local-resource://cloudflare-dark.png',
				iconLightUrl: 'local-resource://cloudflare-light.png',
			}}
			onSaved={() => {}}
			onRemoved={() => {}}
		/>
	);

	expect(Array.from(container.querySelectorAll('img')).map((image) => image.getAttribute('src'))).toEqual([
		'local-resource://cloudflare-light.png',
		'local-resource://cloudflare-dark.png',
	]);
});

it('tests the draft connection with S3 path-style settings', async () => {
	const user = userEvent.setup();
	storageApi.testConnection.mockResolvedValue({ ok: true });
	const draft = {
		id: '',
		name: 'MinIO',
		endpoint: 'https://minio.example.com',
		region: 'us-east-1',
		accessKeyId: 'access',
		secretAccessKey: 'secret',
		bucket: 'friday',
		forcePathStyle: false,
		paths: [],
		syncEnabled: false,
		syncCronExpression: '0 3 * * *',
	};
	render(<ProviderCard storage={draft} onSaved={() => {}} onRemoved={() => {}} />);

	await user.click(screen.getByRole('switch', { name: 'settings.storage.forcePathStyle' }));
	await user.click(screen.getByRole('button', { name: 'settings.storage.test' }));

	await waitFor(() =>
		expect(storageApi.testConnection).toHaveBeenCalledWith({
			...draft,
			forcePathStyle: true,
		})
	);
	expect(screen.getByText('settings.storage.testOk')).toBeVisible();
});
