import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { AuthApi, AuthState } from '../../../src/shared/auth_types';
import { StartupGate } from '../../../src/renderer/src/auth/Gate';
import { AuthProvider } from '../../../src/renderer/src/contexts/AuthContext';

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

it('redirects a configured signed-in user from auth to home', async () => {
	window.auth = authApi({
		status: 'signedIn',
		persistence: 'encrypted',
		user: { id: 'user-id', email: 'user@example.test' },
	});
	window.agent = {
		getProvider: jest.fn(async () => ({ id: 'provider' }) as never),
		getModelId: jest.fn(async () => 'model'),
	} as never;
	renderGate('/auth');
	await waitFor(() => expect(screen.getByText('/home')).toBeInTheDocument());
});

it('allows a signed-out user to continue in local-only mode', async () => {
	localStorage.setItem('friday-auth-local-only', 'true');
	window.auth = authApi({ status: 'signedOut', persistence: 'encrypted' });
	window.agent = {
		getProvider: jest.fn(async () => ({ id: 'provider' }) as never),
		getModelId: jest.fn(async () => 'model'),
	} as never;
	renderGate('/home');
	await waitFor(() => expect(screen.getByText('/home')).toBeInTheDocument());
});

it('sends local-only users to setup when configuration is incomplete', async () => {
	localStorage.setItem('friday-auth-local-only', 'true');
	window.auth = authApi({ status: 'signedOut', persistence: 'encrypted' });
	window.agent = {
		getProvider: jest.fn(async () => undefined),
		getModelId: jest.fn(async () => ''),
	} as never;
	renderGate('/auth');
	await waitFor(() => expect(screen.getByText('/setup')).toBeInTheDocument());
});

it('rechecks configuration when setup finishes', async () => {
	const user = userEvent.setup();
	let configured = false;
	localStorage.setItem('friday-auth-local-only', 'true');
	window.auth = authApi({ status: 'signedOut', persistence: 'encrypted' });
	window.agent = {
		getProvider: jest.fn(async () => (configured ? ({ id: 'provider' } as never) : undefined)),
		getModelId: jest.fn(async () => (configured ? 'model' : '')),
	} as never;
	renderGate('/setup');
	await waitFor(() => expect(screen.getByText('/setup')).toBeInTheDocument());
	configured = true;
	await user.click(screen.getByRole('button', { name: 'Finish setup' }));
	await waitFor(() => expect(screen.getByText('/home')).toBeInTheDocument());
});
