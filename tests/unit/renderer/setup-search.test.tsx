import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from '../../../src/renderer/src/pages/start/components/Search';

const searchApi = {
	getSettings: jest.fn(),
	selectEngine: jest.fn(),
};

beforeEach(() => {
	Object.defineProperty(window, 'search', {
		configurable: true,
		value: searchApi,
	});
});

it('stays empty when a provider is configured but no search engine is selected', async () => {
	const user = userEvent.setup();
	searchApi.getSettings.mockResolvedValue({
		engineId: null,
		configured: { brave: true, tavily: false },
	});
	render(<Search />);

	const trigger = await screen.findByRole('button', {
		name: /Search Engine.*Select a search engine/,
	});
	expect(trigger).not.toHaveTextContent('Brave');
	await user.click(trigger);
	expect(await screen.findByRole('combobox', { name: 'Search Engine' })).not.toHaveTextContent(
		'Brave'
	);
});

it('shows a configured search engine selection', async () => {
	searchApi.getSettings.mockResolvedValue({
		engineId: 'brave',
		configured: { brave: true, tavily: false },
	});
	render(<Search />);

	expect(await screen.findByRole('button', { name: /Search Engine.*Brave/ })).toBeInTheDocument();
});
