import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoragePage from '../../../src/renderer/src/pages/settings/pages/storage/Page';
import type { StorageOperationStatus } from '../../../src/shared/storage_types';

jest.mock('react-i18next', () => {
	const translations: Record<string, string> = {
		'settings.storage.configurationTitle': 'Folder Sync',
		'settings.storage.description': 'Choose folders to back up securely.',
		'settings.storage.cancel': 'Cancel',
		'settings.storage.sync.title': 'Folder Sync',
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
	getSettings: jest.fn(),
	saveSettings: jest.fn(),
	syncFolders: jest.fn(),
	pickFolders: jest.fn(),
	getOperationStatus: jest.fn(),
	onOperationStatusChanged: jest.fn(),
	backup: jest.fn(),
	restore: jest.fn(),
};

let operationListener: ((status: StorageOperationStatus) => void) | undefined;
const unsubscribeOperationStatus = jest.fn();
const settings = {
	paths: [] as string[],
	syncEnabled: false,
	syncCronExpression: '0 3 * * *',
};

beforeEach(() => {
	jest.clearAllMocks();
	operationListener = undefined;
	Object.defineProperty(window, 'PointerEvent', { configurable: true, value: MouseEvent });
	Object.defineProperty(window, 'storage', { configurable: true, value: storageApi });
	storageApi.getSettings.mockResolvedValue(settings);
	storageApi.saveSettings.mockImplementation(async (value) => value);
	storageApi.syncFolders.mockResolvedValue([]);
	storageApi.pickFolders.mockResolvedValue([]);
	storageApi.getOperationStatus.mockResolvedValue(undefined);
	storageApi.onOperationStatusChanged.mockImplementation((listener) => {
		operationListener = listener;
		return unsubscribeOperationStatus;
	});
	storageApi.backup.mockResolvedValue({
		operationId: 'backup-1',
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

it('saves folders and a custom schedule without provider settings', async () => {
	const user = userEvent.setup();
	storageApi.syncFolders.mockResolvedValue([{ key: 'agent', path: '/data/agent' }]);
	render(<StoragePage />);

	await user.click(await screen.findByRole('switch', { name: 'Agent' }));
	await user.click(screen.getByRole('combobox', { name: 'Sync interval' }));
	await user.click(await screen.findByRole('option', { name: 'Every day' }));
	await user.clear(screen.getByLabelText('Cron expression'));
	await user.type(screen.getByLabelText('Cron expression'), '0 4 * * *');
	await user.click(screen.getByRole('button', { name: 'Save schedule' }));

	await waitFor(() =>
		expect(storageApi.saveSettings).toHaveBeenCalledWith({
			paths: ['/data/agent'],
			syncEnabled: true,
			syncCronExpression: '0 4 * * *',
		})
	);
	expect(screen.queryByText(/provider/i)).not.toBeInTheDocument();
});

it('backs up directly and confirms before restoring matching local files', async () => {
	const user = userEvent.setup();
	storageApi.getSettings.mockResolvedValue({ ...settings, paths: ['/data/agent'] });
	render(<StoragePage />);

	await user.click(await screen.findByRole('button', { name: 'Back up now' }));
	await waitFor(() => expect(storageApi.backup).toHaveBeenCalledWith());
	act(() => {
		operationListener?.({
			operationId: 'backup-1',
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
	await waitFor(() => expect(storageApi.restore).toHaveBeenCalledWith());
});

it('rehydrates a running backup after the page remounts', async () => {
	storageApi.getSettings.mockResolvedValue({ ...settings, paths: ['/data/agent'] });
	storageApi.getOperationStatus.mockResolvedValue({
		operationId: 'backup-1',
		operation: 'backup',
		trigger: 'manual',
		state: 'running',
		startedAt: '2026-08-20T10:00:00.000Z',
		transferred: 0,
		skipped: 0,
		failed: 0,
		revision: 1,
	});

	const unsubscribeCount = unsubscribeOperationStatus.mock.calls.length;
	const first = render(<StoragePage />);
	expect(await screen.findByText('Backup is running in the background…')).toBeInTheDocument();
	first.unmount();
	expect(unsubscribeOperationStatus).toHaveBeenCalledTimes(unsubscribeCount + 1);
});

it('keeps a newer completion event when the initial snapshot resolves late', async () => {
	let resolveStatus: ((status: StorageOperationStatus | undefined) => void) | undefined;
	storageApi.getSettings.mockResolvedValue({ ...settings, paths: ['/data/agent'] });
	storageApi.getOperationStatus.mockReturnValue(
		new Promise((resolve) => {
			resolveStatus = resolve;
		})
	);
	render(<StoragePage />);
	await waitFor(() => expect(storageApi.onOperationStatusChanged).toHaveBeenCalled());
	act(() => {
		operationListener?.({
			operationId: 'backup-1',
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
		resolveStatus?.({
			operationId: 'backup-1',
			operation: 'backup',
			trigger: 'manual',
			state: 'running',
			startedAt: '2026-08-20T10:00:00.000Z',
			transferred: 0,
			skipped: 0,
			failed: 0,
			revision: 1,
		});
	});

	expect(await screen.findByText('Backup completed')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Back up now' })).toBeEnabled();
});
