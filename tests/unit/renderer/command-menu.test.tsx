import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommandMenu } from '../../../src/renderer/src/experience/CommandMenu';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string): string => fallback ?? key,
	}),
}));

class ResizeObserverMock {
	observe = jest.fn();
	unobserve = jest.fn();
	disconnect = jest.fn();
}

Object.defineProperty(globalThis, 'ResizeObserver', {
	configurable: true,
	value: ResizeObserverMock,
});

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
	configurable: true,
	value: jest.fn(),
});

it.each(['/home', '/home/session/1', '/settings', '/settings/providers/models'])(
	'opens command search on %s',
	(path) => {
		render(
			<MemoryRouter initialEntries={[path]}>
				<CommandMenu />
			</MemoryRouter>
		);

		fireEvent.keyDown(window, { key: 'f', ctrlKey: true });

		expect(screen.getByPlaceholderText('Search routes and settings...')).toBeInTheDocument();
	}
);

it.each(['/setup', '/homepage', '/settings-old'])(
	'does not open command search on %s',
	(path) => {
		render(
			<MemoryRouter initialEntries={[path]}>
				<CommandMenu />
			</MemoryRouter>
		);

		fireEvent.keyDown(window, { key: 'f', ctrlKey: true });

		expect(screen.queryByPlaceholderText('Search routes and settings...')).not.toBeInTheDocument();
	}
);
