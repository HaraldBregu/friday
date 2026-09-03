import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CloudPage from '../../../src/renderer/src/pages/settings/pages/cloud/Page';

const mockUseAuth = jest.fn();

jest.mock('../../../src/renderer/src/contexts/AuthContext', () => ({
	useAuth: () => mockUseAuth(),
}));

jest.mock('react-i18next', () => {
	const translations: Record<string, string> = {
		'common.tryAgain': 'Try Again',
		'settings.tabs.cloud': 'Cloud',
		'settings.overview.descriptions.cloud': 'Cloud backup and secure key sync',
		'settings.storage.sync.title': 'Cloud Backup',
		'settings.storage.sync.description': 'Configure cloud backup.',
		'settings.storage.folders.agent': 'Assistant workspace',
		'settings.storage.backup': 'Back up now',
		'settings.storage.restore': 'Restore from cloud',
		'settings.storage.sync.addFolders': 'Add folders',
		'settings.storage.autoSync.interval': 'Backup interval',
		'settings.storage.autoSync.description': 'Run on schedule',
		'settings.storage.autoSync.off': 'Off',
		'settings.storage.autoSync.cronExpression': 'Cron expression',
		'settings.storage.autoSync.cronDescription': 'Five-field cron expression',
		'settings.storage.sync.save': 'Save schedule',
		'settings.storage.cancel': 'Cancel',
		'settings.storage.errors.load': 'Could not load cloud backup settings.',
		'settings.storage.credentials.title': 'Secure key sync',
		'settings.storage.credentials.setupDescription':
			'Create a passphrase to encrypt and sync saved API keys.',
		'settings.storage.credentials.unlockDescription': 'Enter the secure key sync passphrase.',
		'settings.storage.credentials.readyDescription': 'Saved API keys are ready to sync.',
		'settings.storage.credentials.passphrase': 'Sync passphrase',
		'settings.storage.credentials.confirmPassphrase': 'Confirm passphrase',
		'settings.storage.credentials.passphraseHelp':
			'Use at least 12 characters. It cannot be recovered.',
		'settings.storage.credentials.setup': 'Enable secure sync',
		'settings.storage.credentials.settingUp': 'Enabling…',
		'settings.storage.credentials.unlock': 'Unlock secure sync',
		'settings.storage.credentials.unlocking': 'Unlocking…',
		'settings.storage.credentials.status': 'Secure key sync',
		'settings.storage.credentials.ready': 'Ready',
		'settings.storage.credentials.pending': 'Pending changes',
		'settings.storage.credentials.lastSync': 'Last sync',
		'settings.storage.credentials.never': 'Not yet synced',
		'settings.storage.credentials.sync': 'Sync now',
		'settings.storage.credentials.syncing': 'Syncing…',
		'settings.storage.credentials.memoryWarning':
			'Secure device storage is unavailable. API keys are kept in memory only.',
		'settings.storage.credentials.errors.load': 'Could not check secure key sync.',
		'settings.storage.credentials.errors.mismatch': 'Passphrases do not match.',
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

const providerApi = {
	vaultStatus: jest.fn(),
	setupVault: jest.fn(),
	unlockVault: jest.fn(),
	syncVault: jest.fn(),
};

const setupStatus = {
	persistence: 'encrypted' as const,
	cloudConfigured: false,
	unlocked: false,
	pending: 0,
};

beforeEach(() => {
	jest.clearAllMocks();
	mockUseAuth.mockReturnValue({
		state: {
			status: 'signedIn',
			persistence: 'encrypted',
			user: { id: 'user-1', email: 'person@example.com' },
		},
		localOnly: false,
		requireSignIn: jest.fn(),
		skipSignIn: jest.fn(),
	});
	Object.defineProperty(window, 'storage', { configurable: true, value: storageApi });
	Object.defineProperty(window, 'provider', { configurable: true, value: providerApi });
	storageApi.getSettings.mockResolvedValue({
		paths: [],
		syncEnabled: false,
		syncCronExpression: '0 3 * * *',
	});
	storageApi.syncFolders.mockResolvedValue([{ key: 'agent', path: '/data/agent' }]);
	storageApi.getOperationStatus.mockResolvedValue(undefined);
	storageApi.onOperationStatusChanged.mockReturnValue(jest.fn());
	providerApi.vaultStatus.mockResolvedValue(setupStatus);
	providerApi.setupVault.mockResolvedValue({
		...setupStatus,
		cloudConfigured: true,
		unlocked: true,
	});
	providerApi.unlockVault.mockResolvedValue({
		...setupStatus,
		cloudConfigured: true,
		unlocked: true,
	});
	providerApi.syncVault.mockResolvedValue({
		...setupStatus,
		cloudConfigured: true,
		unlocked: true,
		lastSyncedAt: '2026-09-03T10:00:00.000Z',
	});
});

it('shows cloud backup controls without provider identity or selection', async () => {
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

	expect(await screen.findByRole('alert')).toHaveTextContent(
		'Could not load cloud backup settings.'
	);
	expect(screen.getByRole('button', { name: 'Try Again' })).toBeEnabled();
	expect(container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
});

it('sets up secure key sync with a confirmed passphrase', async () => {
	const user = userEvent.setup();
	render(
		<MemoryRouter>
			<CloudPage />
		</MemoryRouter>
	);

	await user.type(await screen.findByLabelText('Sync passphrase'), 'a secure passphrase');
	await user.type(screen.getByLabelText('Confirm passphrase'), 'a secure passphrase');
	await user.click(screen.getByRole('button', { name: 'Enable secure sync' }));

	await waitFor(() => expect(providerApi.setupVault).toHaveBeenCalledWith('a secure passphrase'));
	expect(await screen.findByRole('button', { name: 'Sync now' })).toBeEnabled();
});

it('unlocks an existing secure key sync', async () => {
	const user = userEvent.setup();
	providerApi.vaultStatus.mockResolvedValue({
		...setupStatus,
		cloudConfigured: true,
	});
	render(
		<MemoryRouter>
			<CloudPage />
		</MemoryRouter>
	);

	await user.type(await screen.findByLabelText('Sync passphrase'), 'a secure passphrase');
	await user.click(screen.getByRole('button', { name: 'Unlock secure sync' }));

	await waitFor(() => expect(providerApi.unlockVault).toHaveBeenCalledWith('a secure passphrase'));
});

it('runs secure key sync from the ready state', async () => {
	const user = userEvent.setup();
	providerApi.vaultStatus.mockResolvedValue({
		...setupStatus,
		cloudConfigured: true,
		unlocked: true,
		pending: 2,
	});
	render(
		<MemoryRouter>
			<CloudPage />
		</MemoryRouter>
	);

	await user.click(await screen.findByRole('button', { name: 'Sync now' }));
	expect(providerApi.syncVault).toHaveBeenCalledWith();
});

it('explains and blocks secure key setup when device storage is unavailable', async () => {
	providerApi.vaultStatus.mockResolvedValue({
		...setupStatus,
		persistence: 'memory',
	});
	render(
		<MemoryRouter>
			<CloudPage />
		</MemoryRouter>
	);

	expect(await screen.findByText(/secure device storage is unavailable/i)).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Enable secure sync' })).toBeDisabled();
});

it('ignores a stale vault status after account access changes', async () => {
	let resolveStatus: ((status: typeof setupStatus) => void) | undefined;
	providerApi.vaultStatus.mockReturnValue(
		new Promise((resolve) => {
			resolveStatus = resolve;
		})
	);
	const view = render(
		<MemoryRouter>
			<CloudPage />
		</MemoryRouter>
	);
	await waitFor(() => expect(providerApi.vaultStatus).toHaveBeenCalledTimes(1));

	mockUseAuth.mockReturnValue({
		state: { status: 'signedOut', persistence: 'encrypted' },
		localOnly: false,
		requireSignIn: jest.fn(),
		skipSignIn: jest.fn(),
	});
	view.rerender(
		<MemoryRouter>
			<CloudPage />
		</MemoryRouter>
	);
	await act(async () => {
		resolveStatus?.({
			...setupStatus,
			cloudConfigured: true,
			unlocked: true,
		});
	});

	expect(screen.queryByRole('button', { name: 'Sync now' })).not.toBeInTheDocument();
});
