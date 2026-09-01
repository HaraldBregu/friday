import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProvidersPage from '../../../src/renderer/src/pages/settings/pages/providers/Page';

jest.mock('react-i18next', () => {
	const translations: Record<string, string> = {
		'settings.tabs.providers': 'Providers',
		'settings.providers.description': 'Connect providers and configure models.',
		'settings.providers.storeApiKeys': 'Store provider API keys',
		'settings.providers.storeApiKeysDescription': 'Add or update API keys.',
		'settings.providers.modelsDescription': 'Choose a model service.',
		'settings.overview.groups.modelServices': 'Models',
		'settings.modelServices.speechTranscriberName': 'Transcribe',
		'settings.modelServices.speechTranscriberDescription': 'Speech-to-text models',
		'settings.modelServices.voiceName': 'Voice',
		'settings.modelServices.voiceDescription': 'Text-to-speech models',
		'settings.modelServices.imageAssistantName': 'Image',
		'settings.modelServices.imageAssistantDescription': 'Create images from prompts',
		'settings.modelServices.embeddingName': 'Embedding',
		'settings.modelServices.embeddingDescription': 'Text embedding models',
		'settings.modelServices.videoCreatorName': 'Video',
		'settings.modelServices.videoCreatorDescription': 'Video generation models',
		'settings.modelServices.musicCreatorName': 'Audio',
		'settings.modelServices.musicCreatorDescription': 'Audio generation models',
	};
	const t = (key: string): string => translations[key] ?? key;
	return { useTranslation: () => ({ t }) };
});

beforeEach(() => {
	Object.defineProperty(window, 'provider', {
		configurable: true,
		value: { list: jest.fn().mockResolvedValue([]) },
	});
	Object.defineProperty(window, 'search', {
		configurable: true,
		value: {
			getSettings: jest.fn().mockResolvedValue({
				engineId: null,
				configured: { brave: false, tavily: false },
			}),
		},
	});
	Object.defineProperty(window, 'mcp', {
		configurable: true,
		value: { list: jest.fn().mockResolvedValue({}) },
	});
});

describe('Providers settings hub', () => {
	it('opens the provider API key list from the first item', async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter initialEntries={['/settings/providers']}>
				<Routes>
					<Route path="/settings/providers" element={<ProvidersPage />} />
					<Route path="/settings/providers/keys" element={<div>All provider API keys</div>} />
				</Routes>
			</MemoryRouter>
		);
		await user.click(screen.getByRole('button', { name: /Store provider API keys/ }));

		expect(await screen.findByText('All provider API keys')).toBeInTheDocument();
	});

	it('lists models beneath the API key item and uses nested provider routes', async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter initialEntries={['/settings/providers']}>
				<Routes>
					<Route path="/settings/providers" element={<ProvidersPage />} />
					<Route
						path="/settings/providers/transcribe"
						element={<div>Nested transcribe settings</div>}
					/>
				</Routes>
			</MemoryRouter>
		);

		expect(screen.getByText('Models')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Transcribe/ })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Voice/ })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Agent/ })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Storage/ })).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /Transcribe/ }));
		expect(await screen.findByText('Nested transcribe settings')).toBeInTheDocument();
	});
});
