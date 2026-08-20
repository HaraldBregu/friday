import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoragePage from '../../../src/renderer/src/pages/settings/pages/storage/Page';
import type { StorageOperationStatus } from '../../../src/shared/storage_types';

jest.mock('react-i18next', () => {
	const translations: Record<string, string> = {
		'settings.storage.configurationTitle': 'Object Storage Configuration',
		'settings.storage.addProvider': 'Add provider',
		'settings.storage.empty': 'No storage configured',
		'settings.storage.name': 'Name',
		'settings.storage.endpoint': 'Endpoint',
		'settings.storage.region': 'Region',
		'settings.storage.bucket': 'Bucket',
		'settings.storage.accessKeyId': 'Access key ID',
		'settings.storage.secretAccessKey': 'Secret access key',
		'settings.storage.save': 'Save',
		'settings.storage.saved': 'Storage saved',
		'settings.storage.newProviderTitle': 'New storage provider',
		'settings.storage.connectionTitle': 'Connection',
		'settings.storage.credentialsTitle': 'Credentials',
		'settings.storage.optionsTitle': 'Options',
		'settings.storage.forcePathStyle': 'Force path-style',
		'settings.storage.test': 'Test connection',
		'settings.storage.cancel': 'Cancel',
		'settings.storage.cardTitle': 'Object Storage',
		'settings.storage.profile.label': 'Storage to use',
		'settings.storage.profile.help': 'Sync target',
		'settings.storage.sync.description': 'Back up selected folders on a schedule',
		'settings.storage.sync.addFolders': 'Add folders',
		'settings.storage.sync.save': 'Save schedule',
		'settings.storage.syncSaved': 'Schedule saved',
		'settings.storage.autoSync.interval': 'Sync interval',
		'settings.storage.autoSync.description': 'Run on schedule',
		'settings.storage.autoSync.off': 'Off',
		'settings.storage.autoSync.every1d': 'Every day',
		'settings.storage.autoSync.cronExpression': 'Cron expression',
		'settings.storage.autoSync.cronDescription': 'Five-field cron expression',
		'settings.storage.folders.agent': 'Agent',
		'settings.storage.backup': 'Back up now',
		'settings.storage.restore': 'Restore from cloud',
		'settings.storage.restoreDialog.title': 'Restore selected data?',
		'settings.storage.restoreDialog.description': 'Matching local files will be overwritten.',
		'settings.storage.restoreDialog.confirm': 'Restore selected data',
		'settings.storage.operation.backup.running': 'Backup is running in the background…',
		'settings.storage.operation.backup.succeeded': 'Backup completed',
	};
	const t = (key: string): string => translations[key] ?? key;
	return { useTranslation: () => ({ t }) };
});

const storageApi = {
	getStorages: jest.fn(),
	getStorageConfiguration: jest.fn(),
	saveStorageConfiguration: jest.fn(),
	saveStorageConfig: jest.fn(),
	deleteStorageConfig: jest.fn(),
	testConnection: jest.fn(),
	syncFolders: jest.fn(),
	pickFolders: jest.fn(),
	getOperationStatuses: jest.fn(),
	onOperationStatusChanged: jest.fn(),
	backup: jest.fn(),
	restore: jest.fn(),
};

let operationListener: ((status: StorageOperationStatus) => void) | undefined;
const unsubscribeOperationStatus = jest.fn();

const storage = {
	id: 'backup',
	name: 'Friday backup',
	endpoint: 'https://storage.example.com',
	region: 'us-east-1',
	accessKeyId: 'access',
	secretAccessKey: 'secret',
	bucket: 'friday',
	forcePathStyle: false,
	paths: [] as string[],
	syncEnabled: false,
	syncCronExpression: '0 3 * * *',
};

beforeAll(() => {
	Object.defineProperty(globalThis.crypto, 'randomUUID', {
		configurable: true,
		value: () => 'storage-draft',
	});
});

beforeEach(() => {
	operationListener = undefined;
	Object.defineProperty(window, 'PointerEvent', {
		configurable: true,
		value: MouseEvent,
	});
	Object.defineProperty(window, 'storage', { configurable: true, value: storageApi });
	storageApi.getStorages.mockResolvedValue([]);
	storageApi.syncFolders.mockResolvedValue([]);
	storageApi.pickFolders.mockResolvedValue([]);
	storageApi.getOperationStatuses.mockResolvedValue([]);
	storageApi.onOperationStatusChanged.mockImplementation((listener) => {
		operationListener = listener;
		return unsubscribeOperationStatus;
	});
	storageApi.getStorageConfiguration.mockResolvedValue({
		providerId: undefined,
		storageId: undefined,
		paths: [],
		syncEnabled: false,
		syncCronExpression: '0 3 * * *',
	});
	storageApi.saveStorageConfig.mockImplementation(async (config) => ({
		...config,
		id: config.id || 'storage-1',
	}));
	storageApi.saveStorageConfiguration.mockImplementation(async (configuration) => configuration);
	storageApi.backup.mockResolvedValue({
		operationId: 'backup-1',
		storageId: 'backup',
		operation: 'backup',
		trigger: 'manual',
		state: 'running',
		startedAt: '2026-08-20T10:00:00.000Z',
		transferred: 0,
		skipped: 0,
		failed: 0,
		revision: 1,
	});
	storageApi.restore.mockResolvedValue({
		operationId: 'restore-1',
		storageId: 'backup',
		operation: 'restore',
		trigger: 'manual',
		state: 'running',
		startedAt: '2026-08-20T10:00:00.000Z',
		transferred: 0,
		skipped: 0,
		failed: 0,
		revision: 3,
	});
});

it('embeds the provider configurator and saves a storage profile', async () => {
	const user = userEvent.setup();
	render(<StoragePage embedded />);

	await user.click(await screen.findByRole('button', { name: 'Add provider' }));
	await user.type(await screen.findByLabelText('Name'), 'Friday backup');
	await user.type(screen.getByLabelText('Bucket'), 'friday-data');
	await user.type(screen.getByLabelText('Access key ID'), 'access-key');
	await user.type(screen.getByLabelText('Secret access key'), 'secret-key');
	await user.click(screen.getByRole('button', { name: 'Save' }));

	await waitFor(() =>
		expect(storageApi.saveStorageConfig).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Friday backup',
				bucket: 'friday-data',
				accessKeyId: 'access-key',
				secretAccessKey: 'secret-key',
			})
		)
	);
});

it('saves folders and a custom schedule on the selected profile', async () => {
	const user = userEvent.setup();
	storageApi.getStorages.mockResolvedValue([storage]);
	storageApi.getStorageConfiguration.mockResolvedValue({
		providerId: 'backup',
		storageId: undefined,
		paths: [],
		syncEnabled: false,
		syncCronExpression: '0 3 * * *',
	});
	storageApi.syncFolders.mockResolvedValue([{ key: 'agent', path: '/data/agent' }]);

	render(<StoragePage />);

	await user.click(await screen.findByRole('switch', { name: 'Agent' }));
	await user.click(screen.getByRole('combobox', { name: 'Sync interval' }));
	await user.click(await screen.findByRole('option', { name: 'Every day' }));
	await user.clear(screen.getByLabelText('Cron expression'));
	await user.type(screen.getByLabelText('Cron expression'), '0 4 * * *');
	await user.click(screen.getByRole('button', { name: 'Save schedule' }));

	await waitFor(() =>
		expect(storageApi.saveStorageConfig).toHaveBeenCalledWith(
			expect.objectContaining({
				id: 'backup',
				paths: ['/data/agent'],
				syncEnabled: true,
				syncCronExpression: '0 4 * * *',
			})
		)
	);
});

it('backs up directly and confirms before restoring matching local files', async () => {
	const user = userEvent.setup();
	const configured = { ...storage, paths: ['/data/agent'] };
	storageApi.getStorages.mockResolvedValue([configured]);
	storageApi.getStorageConfiguration.mockResolvedValue({
		providerId: 'backup',
		storageId: undefined,
		paths: configured.paths,
		syncEnabled: false,
		syncCronExpression: configured.syncCronExpression,
	});

	render(<StoragePage />);

	await user.click(await screen.findByRole('button', { name: 'Back up now' }));
	await waitFor(() => expect(storageApi.backup).toHaveBeenCalledWith('backup'));
	act(() => {
		operationListener?.({
			operationId: 'backup-1',
			storageId: 'backup',
			operation: 'backup',
			trigger: 'manual',
			state: 'succeeded',
			startedAt: '2026-08-20T10:00:00.000Z',
			finishedAt: '2026-08-20T10:01:00.000Z',
			transferred: 1,
			skipped: 0,
			failed: 0,
			revision: 2,
		});
	});

	await user.click(screen.getByRole('button', { name: 'Restore from cloud' }));
	expect(screen.getByRole('dialog')).toHaveTextContent('Matching local files will be overwritten.');
	await user.click(screen.getByRole('button', { name: 'Restore selected data' }));
	await waitFor(() => expect(storageApi.restore).toHaveBeenCalledWith('backup'));
});

it('rehydrates a running backup after the page remounts', async () => {
	const configured = { ...storage, paths: ['/data/agent'] };
	const running = {
		operationId: 'backup-1',
		storageId: 'backup',
		operation: 'backup',
		trigger: 'manual',
		state: 'running',
		startedAt: '2026-08-20T10:00:00.000Z',
		transferred: 0,
		skipped: 0,
		failed: 0,
		revision: 1,
	};
	storageApi.getStorages.mockResolvedValue([configured]);
	storageApi.getStorageConfiguration.mockResolvedValue({
		providerId: 'backup',
		storageId: undefined,
		paths: configured.paths,
		syncEnabled: false,
		syncCronExpression: configured.syncCronExpression,
	});
	storageApi.getOperationStatuses.mockResolvedValue([running]);

	const unsubscribeCount = unsubscribeOperationStatus.mock.calls.length;
	const first = render(<StoragePage />);
	expect(await screen.findByText('Backup is running in the background…')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'settings.storage.pushing' })).toBeDisabled();
	first.unmount();
	expect(unsubscribeOperationStatus).toHaveBeenCalledTimes(unsubscribeCount + 1);

	render(<StoragePage />);
	expect(await screen.findByText('Backup is running in the background…')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'settings.storage.pushing' })).toBeDisabled();
});

it('keeps a newer completion event when the initial status snapshot resolves late', async () => {
	const configured = { ...storage, paths: ['/data/agent'] };
	let resolveStatuses: ((statuses: StorageOperationStatus[]) => void) | undefined;
	storageApi.getStorages.mockResolvedValue([configured]);
	storageApi.getStorageConfiguration.mockResolvedValue({
		providerId: 'backup',
		storageId: undefined,
		paths: configured.paths,
		syncEnabled: false,
		syncCronExpression: configured.syncCronExpression,
	});
	storageApi.getOperationStatuses.mockReturnValue(
		new Promise((resolve) => {
			resolveStatuses = resolve;
		})
	);

	render(<StoragePage />);
	await waitFor(() => expect(storageApi.onOperationStatusChanged).toHaveBeenCalled());
	act(() => {
		operationListener?.({
			operationId: 'backup-1',
			storageId: 'backup',
			operation: 'backup',
			trigger: 'manual',
			state: 'succeeded',
			startedAt: '2026-08-20T10:00:00.000Z',
			finishedAt: '2026-08-20T10:01:00.000Z',
			transferred: 2,
			skipped: 0,
			failed: 0,
			revision: 2,
		});
	});
	await act(async () => {
		resolveStatuses?.([
			{
				operationId: 'backup-1',
				storageId: 'backup',
				operation: 'backup',
				trigger: 'manual',
				state: 'running',
				startedAt: '2026-08-20T10:00:00.000Z',
				transferred: 0,
				skipped: 0,
				failed: 0,
				revision: 1,
			},
		]);
	});

	expect(await screen.findByText('Backup completed')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Back up now' })).toBeEnabled();
});
