const registerCommandWithEvent = jest.fn();
const registerQueryWithEvent = jest.fn();

jest.mock('../../../../src/main/ipc/core/gateway', () => ({
	registerCommandWithEvent,
	registerQueryWithEvent,
}));

import { BrowserWindow, shell } from 'electron';
import { AuthIpc } from '../../../../src/main/ipc/auth';
import { AuthChannels } from '../../../../src/shared/ipc_channels_definitions';

const state = {
	status: 'signedIn' as const,
	persistence: 'encrypted' as const,
	user: { id: 'user-id', email: 'user@example.test' },
};
const auth = {
	getState: jest.fn(() => state),
	getProfile: jest.fn(async () => ({ firstName: 'Ada', lastName: 'Byron' })),
	updateProfile: jest.fn(async (profile) => profile),
	signIn: jest.fn(async () => state),
	signInWithGoogle: jest.fn(),
	signUp: jest.fn(async () => state),
	resendConfirmation: jest.fn(async () => undefined),
	requestPasswordReset: jest.fn(async () => undefined),
	updatePassword: jest.fn(async () => state),
	signOut: jest.fn(async () => ({ status: 'signedOut', persistence: 'encrypted' })),
	onStateChanged: jest.fn(() => jest.fn()),
};
const windows = { has: jest.fn(() => true) };
const extensions = { has: jest.fn(() => false) };
const sender = { id: 1, mainFrame: {} };
const event = { sender, senderFrame: sender.mainFrame };

function query(channel: string): (...args: unknown[]) => unknown {
	return registerQueryWithEvent.mock.calls.find(([registered]) => registered === channel)?.[1];
}

function command(channel: string): (...args: unknown[]) => unknown {
	return registerCommandWithEvent.mock.calls.find(([registered]) => registered === channel)?.[1];
}

beforeEach(() => {
	jest.clearAllMocks();
	windows.has.mockReturnValue(true);
	extensions.has.mockReturnValue(false);
	(BrowserWindow.fromWebContents as jest.Mock).mockReturnValue({ id: 7, webContents: sender });
	new AuthIpc().register(
		{ auth: auth as never, windows: windows as never, extensions: extensions as never },
		{} as never
	);
});

it('returns only the public token-free auth projection to a trusted launcher', async () => {
	expect(query(AuthChannels.getState)(event)).toEqual(state);
	expect(JSON.stringify(query(AuthChannels.getState)(event))).not.toMatch(
		/access_token|refresh_token/
	);
	await expect(
		command(AuthChannels.signIn)(event, {
			email: 'user@example.test',
			password: 'valid-password',
		})
	).resolves.toEqual(state);
});

it('opens the Supabase Google authorization URL in the system browser', async () => {
	const url = 'https://project.supabase.co/auth/v1/authorize?provider=google';
	auth.signInWithGoogle.mockResolvedValueOnce(url);

	await command(AuthChannels.signInWithGoogle)(event);

	expect(shell.openExternal).toHaveBeenCalledWith(url);
});

it('reads and validates account profile updates', async () => {
	await expect(query(AuthChannels.getProfile)(event)).resolves.toEqual({
		firstName: 'Ada',
		lastName: 'Byron',
	});
	await expect(
		command(AuthChannels.updateProfile)(event, {
			firstName: ' Grace ',
			lastName: ' Hopper ',
		})
	).resolves.toEqual({ firstName: 'Grace', lastName: 'Hopper' });
	expect(auth.updateProfile).toHaveBeenCalledWith({ firstName: 'Grace', lastName: 'Hopper' });
	expect(() =>
		command(AuthChannels.updateProfile)(event, { firstName: ' ', lastName: 'Hopper' })
	).toThrow('First name is required.');
});

it('rejects child-frame callers before invoking auth', () => {
	expect(() => query(AuthChannels.getState)({ ...event, senderFrame: {} })).toThrow(
		'restricted to the main frame'
	);
	expect(auth.getState).not.toHaveBeenCalled();
});

it('rejects unregistered and extension renderers', () => {
	windows.has.mockReturnValue(false);
	expect(() => query(AuthChannels.getState)(event)).toThrow('unavailable to this renderer');
	extensions.has.mockReturnValue(true);
	expect(() => query(AuthChannels.getState)(event)).toThrow('unavailable to extension views');
	expect(auth.getState).not.toHaveBeenCalled();
});
