import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { AuthApi, AuthState } from '../../../src/shared/auth_types';
import { StartupGate } from '../../../src/renderer/src/auth/Gate';
import { AuthProvider } from '../../../src/renderer/src/contexts/AuthContext';
import AuthPage from '../../../src/renderer/src/pages/auth/Page';

jest.mock('../../../src/renderer/src/components/app/base/logo-view', () => ({
	LogoView: () => <span aria-label="Friday" />,
}));

function Location(): React.JSX.Element {
	const location = useLocation();
	const navigate = useNavigate();
	return (
		<>
			<p>{location.pathname}</p>
			<button type="button" onClick={() => navigate('/home')}>
				Finish setup
			</button>
		</>
	);
}

function authApi(state: AuthState): AuthApi {
	return {
		getState: jest.fn(async () => state),
		signIn: jest.fn(),
		signUp: jest.fn(),
		resendConfirmation: jest.fn(),
		requestPasswordReset: jest.fn(),
		updatePassword: jest.fn(),
		signOut: jest.fn(),
		onStateChanged: jest.fn(() => jest.fn()),
	};
}

function renderGate(path: string): void {
	render(
		<AuthProvider>
			<MemoryRouter initialEntries={[path]}>
				<Routes>
					<Route
						path="*"
						element={
							<StartupGate>
								<Location />
							</StartupGate>
						}
					/>
				</Routes>
			</MemoryRouter>
		</AuthProvider>
	);
}

beforeEach(() => {
	localStorage.clear();
});

it('redirects a signed-out protected route to auth', async () => {
	window.auth = authApi({ status: 'signedOut', persistence: 'encrypted' });
	renderGate('/home');
	await waitFor(() => expect(screen.getByText('/auth')).toBeInTheDocument());
});

it('redirects a signed-out user from start to auth', async () => {
	window.auth = authApi({ status: 'signedOut', persistence: 'memory' });
	renderGate('/start');
	await waitFor(() => expect(screen.getByText('/auth')).toBeInTheDocument());
});

it('shows the start page while the session is loading', () => {
	window.auth = {
		...authApi({ status: 'loading', persistence: 'memory' }),
		getState: jest.fn(() => new Promise<AuthState>(() => undefined)),
	};
	renderGate('/start');
	expect(screen.getByRole('heading', { name: 'Your desktop AI copilot' })).toBeInTheDocument();
	expect(screen.getByRole('status')).toHaveTextContent('Preparing your workspace…');
});

it('redirects a configured signed-in user from start to home', async () => {
	window.auth = authApi({
		status: 'signedIn',
		persistence: 'encrypted',
		user: { id: 'user-id', email: 'user@example.test' },
	});
	window.agent = {
		getProvider: jest.fn(async () => ({ id: 'provider' }) as never),
		getModelId: jest.fn(async () => 'model'),
	} as never;
	renderGate('/start');
	await waitFor(() => expect(screen.getByText('/home')).toBeInTheDocument());
});

it('redirects an unconfigured signed-in user from start to setup', async () => {
	window.auth = authApi({
		status: 'signedIn',
		persistence: 'memory',
		user: { id: 'user-id', email: 'user@example.test' },
	});
	window.agent = {
		getProvider: jest.fn(async () => undefined),
		getModelId: jest.fn(async () => ''),
	} as never;
	renderGate('/start');
	await waitFor(() => expect(screen.getByText('/setup')).toBeInTheDocument());
});

it('allows a signed-out user to continue in local-only mode', async () => {
	const user = userEvent.setup();
	window.auth = authApi({ status: 'signedOut', persistence: 'encrypted' });
	window.agent = {
		getProvider: jest.fn(async () => ({ id: 'provider' }) as never),
		getModelId: jest.fn(async () => 'model'),
	} as never;
	render(
		<AuthProvider>
			<MemoryRouter initialEntries={['/auth']}>
				<StartupGate>
					<Routes>
						<Route path="/auth" element={<AuthPage />} />
						<Route path="*" element={<Location />} />
					</Routes>
				</StartupGate>
			</MemoryRouter>
		</AuthProvider>
	);
	await user.click(await screen.findByRole('button', { name: 'Skip for now' }));
	await waitFor(() => expect(screen.getByText('/home')).toBeInTheDocument());
});

it('ignores a previously persisted local-only preference', async () => {
	localStorage.setItem('friday-auth-local-only', 'true');
	window.auth = authApi({ status: 'signedOut', persistence: 'encrypted' });
	renderGate('/home');
	await waitFor(() => expect(screen.getByText('/auth')).toBeInTheDocument());
});

it('sends skipped sign-in to setup when configuration is incomplete', async () => {
	const user = userEvent.setup();
	window.auth = authApi({ status: 'signedOut', persistence: 'encrypted' });
	window.agent = {
		getProvider: jest.fn(async () => undefined),
		getModelId: jest.fn(async () => ''),
	} as never;
	render(
		<AuthProvider>
			<MemoryRouter initialEntries={['/auth']}>
				<StartupGate>
					<Routes>
						<Route path="/auth" element={<AuthPage />} />
						<Route path="*" element={<Location />} />
					</Routes>
				</StartupGate>
			</MemoryRouter>
		</AuthProvider>
	);
	await user.click(await screen.findByRole('button', { name: 'Skip for now' }));
	await waitFor(() => expect(screen.getByText('/setup')).toBeInTheDocument());
});

it('rechecks configuration when setup finishes', async () => {
	const user = userEvent.setup();
	let configured = false;
	window.auth = authApi({ status: 'signedOut', persistence: 'encrypted' });
	window.agent = {
		getProvider: jest.fn(async () => (configured ? ({ id: 'provider' } as never) : undefined)),
		getModelId: jest.fn(async () => (configured ? 'model' : '')),
	} as never;
	render(
		<AuthProvider>
			<MemoryRouter initialEntries={['/auth']}>
				<StartupGate>
					<Routes>
						<Route path="/auth" element={<AuthPage />} />
						<Route path="*" element={<Location />} />
					</Routes>
				</StartupGate>
			</MemoryRouter>
		</AuthProvider>
	);
	await user.click(await screen.findByRole('button', { name: 'Skip for now' }));
	await waitFor(() => expect(screen.getByText('/setup')).toBeInTheDocument());
	configured = true;
	await user.click(screen.getByRole('button', { name: 'Finish setup' }));
	await waitFor(() => expect(screen.getByText('/home')).toBeInTheDocument());
});
