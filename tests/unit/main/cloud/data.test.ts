import type { AccountSession } from '../../../../src/main/cloud/account';
import { CloudService } from '../../../../src/main/cloud/data';
import type { CloudRepository } from '../../../../src/main/cloud/repository';

function repository(): jest.Mocked<CloudRepository> {
	return {
		setAccessToken: jest.fn(async () => undefined),
		listSessions: jest.fn(async () => []),
		upsertSession: jest.fn(),
		deleteSession: jest.fn(async () => undefined),
		listMessages: jest.fn(async () => []),
		upsertMessage: jest.fn(),
		uploadFile: jest.fn(),
		downloadFile: jest.fn(),
		deleteFile: jest.fn(async () => undefined),
		watchSession: jest.fn(async () => undefined),
		unwatchSession: jest.fn(async () => undefined),
		clearWatches: jest.fn(async () => undefined),
	};
}

it('passes the signed-in owner to writes and forwards neutral change events', async () => {
	const remote = repository();
	remote.upsertSession.mockResolvedValue({
		id: 'session-1',
		title: 'Cloud chat',
		createdAt: '2026-09-03T00:00:00.000Z',
		updatedAt: '2026-09-03T00:00:00.000Z',
	});
	let watchListener: ((event: 'created' | 'updated' | 'deleted') => void) | undefined;
	remote.watchSession.mockImplementation(async (_sessionId, listener) => {
		watchListener = listener;
	});
	const auth = {
		getAccessToken: () => 'private-token',
		getSignedInUserId: () => 'owner-1',
		onSessionChanged: () => jest.fn(),
	};
	const service = new CloudService(auth, remote);
	const changed = jest.fn();
	service.onSessionChanged(changed);

	service.initialize();
	await service.upsertSession({ id: 'session-1', title: 'Cloud chat' });
	await service.watchSession('session-1');
	watchListener?.('updated');

	expect(remote.setAccessToken).toHaveBeenCalledWith('private-token');
	expect(remote.upsertSession).toHaveBeenCalledWith('owner-1', {
		id: 'session-1',
		title: 'Cloud chat',
	});
	expect(changed).toHaveBeenCalledWith({ sessionId: 'session-1', event: 'updated' });
});

it('rejects cloud access without a fully signed-in account', async () => {
	const remote = repository();
	const auth = {
		getAccessToken: () => null,
		getSignedInUserId: () => undefined,
		onSessionChanged: () => jest.fn(),
	};
	const service = new CloudService(auth, remote);

	expect(() => service.listSessions()).toThrow('Sign in to use cloud synchronization.');
	expect(remote.listSessions).not.toHaveBeenCalled();
});

it('serializes token revocation after an in-flight sign-in update', async () => {
	let sessionListener: ((session: AccountSession | null) => void) | undefined;
	let finishSignIn!: () => void;
	const remote = repository();
	remote.setAccessToken.mockImplementation((token) =>
		token
			? new Promise<void>((resolve) => {
					finishSignIn = resolve;
				})
			: Promise.resolve()
	);
	const auth = {
		getAccessToken: () => 'private-token',
		getSignedInUserId: () => 'owner-1',
		onSessionChanged: (listener: (session: AccountSession | null) => void) => {
			sessionListener = listener;
			return jest.fn();
		},
	};
	const service = new CloudService(auth, remote);

	service.initialize();
	await Promise.resolve();
	sessionListener?.(null);
	await Promise.resolve();
	expect(remote.setAccessToken).toHaveBeenCalledTimes(1);

	finishSignIn();
	await service.destroy();

	expect(remote.setAccessToken.mock.calls).toEqual([['private-token'], [null]]);
	expect(remote.clearWatches).toHaveBeenCalled();
});
