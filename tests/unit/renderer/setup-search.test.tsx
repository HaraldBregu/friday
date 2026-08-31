import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetupSearch } from '../../../src/renderer/src/pages/setup/components/SetupSearch';

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
	render(<SetupSearch />);

	const trigger = await screen.findByRole('button', {
		name: /SetupSearch Engine.*Select a search engine/,
	});
	expect(trigger).not.toHaveTextContent('Brave');
	await user.click(trigger);
	expect(await screen.findByRole('combobox', { name: 'SetupSearch Engine' })).not.toHaveTextContent(
		'Brave'
	);
});

it('shows a configured search engine selection', async () => {
	searchApi.getSettings.mockResolvedValue({
		engineId: 'brave',
		configured: { brave: true, tavily: false },
	});
	render(<SetupSearch />);

	expect(await screen.findByRole('button', { name: /SetupSearch Engine.*Brave/ })).toBeInTheDocument();
});
