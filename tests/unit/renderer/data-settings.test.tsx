import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataPage from '../../../src/renderer/src/pages/settings/pages/assistant/data/Page';

jest.mock('react-i18next', () => {
	const translations: Record<string, string> = {
		'settings.dataControls.title': 'Data management',
		'settings.dataControls.description': 'Export or purge assistant data',
		'settings.dataControls.export': 'Export',
		'settings.dataControls.purge': 'Purge',
		'settings.dataControls.memory': 'Persistent memory',
		'settings.dataControls.memoryDescription': 'Saved facts',
		'settings.dataControls.sessions': 'Assistant sessions',
		'settings.dataControls.sessionsDescription': 'Listed sessions',
		'settings.dataControls.ragIndex': 'Full local knowledge index',
		'settings.dataControls.ragIndexDescription': 'All local chunks',
		'settings.dataControls.ragNamespace': 'Active local namespace',
		'settings.dataControls.ragNamespaceDescription': 'Active local chunks',
		'settings.dataControls.remoteNamespace': 'Pinecone namespace',
		'settings.dataControls.remoteNamespaceDescription': 'Exact remote namespace',
		'settings.dataControls.remoteAllNamespaces': 'All Pinecone namespaces',
		'settings.dataControls.remoteAllNamespacesDescription': 'All remote namespaces',
		'settings.dataControls.wiki': 'Managed wiki',
		'settings.dataControls.wikiDescription': 'Compiled pages',
	};
	const t = (key: string): string => translations[key] ?? key;
	return { useTranslation: () => ({ t }) };
});

const dataControls = {
	listScopes: jest.fn().mockResolvedValue([
		{ kind: 'memory' },
		{
			kind: 'sessions',
			sessionIds: ['11111111-1111-4111-8111-111111111111'],
		},
		{ kind: 'rag', mode: 'local_index', indexName: 'knowledge-base' },
		{
			kind: 'rag',
			mode: 'local_namespace',
			indexName: 'knowledge-base',
			generation: 'kucedr-11111111-1111-4111-8111-111111111111',
		},
		{
			kind: 'rag',
			mode: 'remote_namespace',
			indexName: 'knowledge-base',
			generation: 'kucedr-11111111-1111-4111-8111-111111111111',
		},
		{ kind: 'wiki', targetPath: '/wiki' },
	]),
	export: jest.fn().mockResolvedValue(undefined),
	previewPurge: jest.fn().mockResolvedValue({ confirmationId: 'confirmation-id' }),
	purge: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
	Object.defineProperty(window, 'dataControls', {
		configurable: true,
		value: dataControls,
	});
	jest.clearAllMocks();
});

it('exports and previews a purge for the exact selected data scope', async () => {
	const user = userEvent.setup();
	render(<DataPage />);

	const memoryTitle = await screen.findByText('Persistent memory');
	expect(screen.queryByText('Full local knowledge index')).not.toBeInTheDocument();
	expect(screen.queryByText('Managed wiki')).not.toBeInTheDocument();
	const row = memoryTitle.closest('[class*="grid"]') as HTMLElement;
	await user.click(within(row).getByRole('button', { name: 'Export' }));
	await waitFor(() => expect(dataControls.export).toHaveBeenCalledWith({ kind: 'memory' }));
	await user.click(within(row).getByRole('button', { name: 'Purge' }));
	await waitFor(() =>
		expect(dataControls.purge).toHaveBeenCalledWith({ kind: 'memory' }, 'confirmation-id')
	);
});
