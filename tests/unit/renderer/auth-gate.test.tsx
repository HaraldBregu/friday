import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { AuthApi, AuthState } from '../../../src/shared/auth_types';
import { StartupGate } from '../../../src/renderer/src/auth/Gate';
import { AuthProvider } from '../../../src/renderer/src/contexts/AuthContext';

jest.mock('../../../src/renderer/src/components/app/base/logo-view', () => ({
	LogoView: () => <span aria-label="Friday" />,
}));

function Location(): React.JSX.Element {
	return <p>{useLocation().pathname}</p>;
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
