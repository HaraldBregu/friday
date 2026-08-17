import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '../../../src/renderer/src/pages/settings/Layout';
import { SettingsBreadcrumb } from '../../../src/renderer/src/pages/settings/Breadcrumb';
import ExtensionsPage from '../../../src/renderer/src/pages/settings/pages/extensions/Page';
import type { Extension } from '../../../src/shared/extension_types';

jest.mock('react-i18next', () => {
	const t = (key: string, values?: Record<string, string>): string =>
		values ? `${key} ${JSON.stringify(values)}` : key;
	return { useTranslation: () => ({ t }) };
});

const extensions: Extension[] = [
	{
		id: 'demo-extension',
		title: 'Demo Extension',
		description: 'A demo extension.',
		metadata: {
			version: '1.0.0',
			category: 'Demo',
			entry: 'index.html',
		},
	},
];

beforeEach(() => {
	Object.defineProperty(window, 'extensions', {
		configurable: true,
		value: {
			list: jest.fn().mockResolvedValue(extensions),
			open: jest.fn(),
			openRoot: jest.fn(),
			delete: jest.fn().mockResolvedValue(undefined),
			import: jest.fn(),
		},
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
});

it('confirms before deleting an extension', async () => {
	const user = userEvent.setup();
	const deleteExtension = window.extensions.delete as jest.Mock;
	deleteExtension
		.mockResolvedValueOnce(false)
		.mockRejectedValueOnce(new Error('Delete failed'))
		.mockResolvedValueOnce(true);

	render(
		<MemoryRouter initialEntries={['/settings/extensions']}>
			<Routes>
				<Route path="/settings" element={<Layout />}>
					<Route path="extensions">
						<Route index element={<ExtensionsPage />} />
						<Route path=":extensionId" element={<p>Extension detail</p>} />
					</Route>
				</Route>
			</Routes>
		</MemoryRouter>
	);

	const deleteButton = await screen.findByRole('button', {
		name: /settings.extensions.deleteAction/,
	});
	await user.click(deleteButton);

	expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
	await waitFor(() => expect(deleteExtension).toHaveBeenCalledTimes(1));
	expect(screen.getByText('Demo Extension')).toBeInTheDocument();

	await user.click(deleteButton);
	expect(await screen.findByText('Delete failed')).toBeInTheDocument();
	expect(screen.getByText('Demo Extension')).toBeInTheDocument();

	await user.click(deleteButton);
	await waitFor(() => expect(deleteExtension).toHaveBeenCalledTimes(3));
	expect(deleteExtension).toHaveBeenLastCalledWith('demo-extension');
	await waitFor(() => expect(screen.queryByText('Demo Extension')).not.toBeInTheDocument());
	expect(screen.queryByText('Extension detail')).not.toBeInTheDocument();
});

it('opens the extensions folder from the page header', async () => {
	const user = userEvent.setup();

	render(
		<MemoryRouter initialEntries={['/settings/extensions']}>
			<Routes>
				<Route path="/settings" element={<Layout />}>
					<Route path="extensions" element={<ExtensionsPage />} />
				</Route>
			</Routes>
		</MemoryRouter>
	);

	await user.click(screen.getByRole('button', { name: 'settings.extensions.openFolder' }));

	expect(window.extensions.openRoot).toHaveBeenCalledTimes(1);
});

it('navigates extension clicks to the extension detail subroute', async () => {
	const user = userEvent.setup();

	render(
		<MemoryRouter initialEntries={['/settings/extensions']}>
			<Routes>
				<Route path="/settings" element={<Layout />}>
					<Route path="extensions">
						<Route index element={<ExtensionsPage />} />
						<Route path=":extensionId" element={<p>Extension detail</p>} />
					</Route>
				</Route>
			</Routes>
		</MemoryRouter>
	);

	await user.click(
		await screen.findByRole('button', { name: 'Demo Extension A demo extension. Demo' })
	);

	expect(await screen.findByText('Extension detail')).toBeInTheDocument();
});

it('treats an extension detail route as a child of the extensions breadcrumb', async () => {
	const user = userEvent.setup();

	render(
		<MemoryRouter initialEntries={['/settings/extensions/demo-extension']}>
			<SettingsBreadcrumb />
			<Routes>
				<Route path="/settings" element={<Layout />}>
					<Route path="extensions">
						<Route index element={<p>Extensions list</p>} />
						<Route path=":extensionId" element={<p>Extension detail</p>} />
					</Route>
				</Route>
			</Routes>
		</MemoryRouter>
	);

	const breadcrumb = screen.getByRole('navigation', { name: 'settings.breadcrumb.label' });
	expect(within(breadcrumb).getByText('demo-extension')).toBeInTheDocument();

	await user.click(within(breadcrumb).getByRole('link', { name: 'settings.tabs.extensions' }));
	expect(await screen.findByText('Extensions list')).toBeInTheDocument();
});
