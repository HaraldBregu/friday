import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthApi, AuthState } from '../../../src/shared/auth_types';
import { AuthProvider } from '../../../src/renderer/src/contexts/AuthContext';
import { AuthStep } from '../../../src/renderer/src/pages/start/components/AuthStep';

function authApi(state: AuthState): AuthApi {
	let listener: ((next: AuthState) => void) | undefined;
	return {
		getState: jest.fn(async () => state),
		signIn: jest.fn(async () => state),
		signUp: jest.fn(async (input) => {
			const next: AuthState = {
				status: 'confirmationRequired',
				email: input.email,
				persistence: 'encrypted',
			};
			listener?.(next);
			return next;
		}),
		resendConfirmation: jest.fn(async () => undefined),
		requestPasswordReset: jest.fn(async () => undefined),
		updatePassword: jest.fn(async () => state),
		signOut: jest.fn(async () => state),
		onStateChanged: jest.fn((callback) => {
			listener = callback;
			return jest.fn();
		}),
	};
}

beforeEach(() => {
	window.auth = authApi({ status: 'signedOut', persistence: 'encrypted' });
});

it('submits email and password to sign in', async () => {
	const user = userEvent.setup();
	render(
		<AuthProvider>
			<AuthStep />
		</AuthProvider>
	);
	await user.type(screen.getByLabelText('Email'), 'user@example.test');
	await user.type(screen.getByLabelText('Password'), 'valid-password');
	await user.click(screen.getByRole('button', { name: 'Sign in' }));
	await waitFor(() =>
		expect(window.auth.signIn).toHaveBeenCalledWith({
			email: 'user@example.test',
			password: 'valid-password',
		})
	);
});

it('creates an account and shows the confirmation state', async () => {
	const user = userEvent.setup();
	render(
		<AuthProvider>
			<AuthStep />
		</AuthProvider>
	);
	await user.click(screen.getByRole('button', { name: 'New to Friday? Create an account' }));
	await user.type(screen.getByLabelText('Email'), 'new@example.test');
	await user.type(screen.getByLabelText('Password'), 'valid-password');
	await user.type(screen.getByLabelText('Confirm password'), 'valid-password');
	await user.click(screen.getByRole('button', { name: 'Create account' }));
	await waitFor(() =>
		expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
	);
	expect(window.auth.signUp).toHaveBeenCalledWith({
		email: 'new@example.test',
		password: 'valid-password',
	});
});

it('keeps branding and local-only continuation out of the account content', async () => {
	render(
		<AuthProvider>
			<AuthStep />
		</AuthProvider>
	);

	expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
	expect(screen.queryByText('Friday Cloud')).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Skip for now' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
});
