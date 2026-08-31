import { createClient } from '@supabase/supabase-js';
import { AuthService } from '../../../../src/main/cloud/auth';
import type { AuthStorage } from '../../../../src/main/cloud/session';

jest.mock('@supabase/supabase-js', () => ({
	createClient: jest.fn(),
}));

const createClientMock = createClient as jest.Mock;
const unsubscribe = jest.fn();
const getSession = jest.fn(async () => ({ data: { session: null }, error: null }));
const onAuthStateChange = jest.fn(() => ({ data: { subscription: { unsubscribe } } }));
const stopAutoRefresh = jest.fn();

beforeEach(() => {
	createClientMock.mockReturnValue({
		auth: {
			getSession,
			onAuthStateChange,
			stopAutoRefresh,
		},
	});
});

it('configures Supabase to restore sessions from encrypted main-process storage', async () => {
	const storage: AuthStorage = {
		persistence: 'encrypted',
		getItem: jest.fn(() => null),
		setItem: jest.fn(),
		removeItem: jest.fn(),
	};
	const service = new AuthService(
		{
			url: 'https://project.supabase.co',
			publishableKey: 'sb_publishable_test',
			redirectUrl: 'friday://auth/callback',
		},
		storage
	);

	await service.initialize();

	expect(createClientMock).toHaveBeenCalledWith(
		'https://project.supabase.co',
		'sb_publishable_test',
		expect.objectContaining({
			auth: expect.objectContaining({
				persistSession: true,
				storage,
			}),
		})
	);
	expect(service.getState()).toEqual({ status: 'signedOut', persistence: 'encrypted' });
});

it('restores a persisted session without exposing its tokens in public auth state', async () => {
	getSession.mockResolvedValueOnce({
		data: {
			session: {
				access_token: 'access-secret',
				refresh_token: 'refresh-secret',
				user: {
					id: 'user-id',
					email: 'user@example.test',
					user_metadata: {},
				},
			},
		},
		error: null,
	});
	const service = new AuthService(
		{
			url: 'https://project.supabase.co',
			publishableKey: 'sb_publishable_test',
			redirectUrl: 'friday://auth/callback',
		},
		{
			persistence: 'encrypted',
			getItem: jest.fn(() => null),
			setItem: jest.fn(),
			removeItem: jest.fn(),
		}
	);

	await service.initialize();

	expect(service.getState()).toEqual({
		status: 'signedIn',
		persistence: 'encrypted',
		user: { id: 'user-id', email: 'user@example.test' },
	});
	expect(JSON.stringify(service.getState())).not.toMatch(/access-secret|refresh-secret/);
});
