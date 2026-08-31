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
