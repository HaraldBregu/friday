import { SupabaseCloudRepository } from '../../../../src/main/cloud/supabase/records';

function watchHarness() {
	let broadcast!: (payload: { event: string }) => void;
	let status!: (value: string) => void;
	const channel = {
		on: jest.fn(),
		subscribe: jest.fn(),
	};
	channel.on.mockImplementation(
		(_type: string, _filter: unknown, listener: (payload: { event: string }) => void) => {
			broadcast = listener;
			return channel;
		}
	);
	channel.subscribe.mockImplementation((listener: (value: string) => void) => {
		status = listener;
		return channel;
	});
	const single = jest.fn(async () => ({ data: { id: 'session-1' }, error: null }));
	const eq = jest.fn(() => ({ single }));
	const select = jest.fn(() => ({ eq }));
	const removeChannel = jest.fn(async () => 'ok');
	const client = {
		from: jest.fn(() => ({ select })),
		channel: jest.fn(() => channel),
		removeChannel,
	};
	return {
		broadcast: (event: string) => broadcast({ event }),
		channel,
		client,
		removeChannel,
		status: (value: string) => status(value),
	};
}

it('turns provider failures into a generic cloud error', async () => {
	const providerMessage = 'relation chat_sessions exposed internal tenant details';
	const order = jest.fn(async () => ({
		data: null,
		error: { code: 'PROVIDER_FAILURE', message: providerMessage },
	}));
	const select = jest.fn(() => ({ order }));
	const repository = new SupabaseCloudRepository({
		from: jest.fn(() => ({ select })),
	} as never);

	await expect(repository.listSessions()).rejects.toMatchObject({
		message: 'The cloud request failed. Please try again.',
	});
	await expect(repository.listSessions()).rejects.not.toThrow(providerMessage);
});

it('removes an uploaded object when its metadata write fails', async () => {
	const objectError = { code: '42501', message: 'provider policy detail' };
	const upload = jest.fn(async () => ({ error: null }));
	const remove = jest.fn(async () => ({ error: null }));
	const single = jest.fn(async () => ({ data: null, error: objectError }));
	const select = jest.fn(() => ({ single }));
	const insert = jest.fn(() => ({ select }));
	const repository = new SupabaseCloudRepository({
		storage: { from: jest.fn(() => ({ upload, remove })) },
		from: jest.fn(() => ({ insert })),
	} as never);

	await expect(
		repository.uploadFile('owner-1', {
			id: 'file-1',
			sessionId: 'session-1',
			fileName: 'report.pdf',
			mimeType: 'application/pdf',
			data: new Uint8Array([1, 2, 3]).buffer,
		})
	).rejects.toMatchObject({
		message: 'Your account is not allowed to access this cloud item.',
	});
	expect(remove).toHaveBeenCalledWith(['owner-1/sessions/session-1/file-1/report.pdf']);
});

it('waits for a successful watch subscription and maps database events to neutral names', async () => {
	const harness = watchHarness();
	const repository = new SupabaseCloudRepository(harness.client as never);
	const listener = jest.fn();
	let settled = false;

	const watching = repository.watchSession('session-1', listener).then(() => {
		settled = true;
	});
	await Promise.resolve();
	await Promise.resolve();

	expect(harness.channel.subscribe).toHaveBeenCalled();
	expect(settled).toBe(false);
	harness.status('SUBSCRIBED');
	await watching;
	harness.broadcast('INSERT');
	harness.broadcast('UPDATE');
	harness.broadcast('DELETE');
	harness.broadcast('UNKNOWN');

	expect(listener.mock.calls).toEqual([['created'], ['updated'], ['deleted']]);
});

it('removes and forgets a watch channel when subscription fails', async () => {
	const harness = watchHarness();
	const repository = new SupabaseCloudRepository(harness.client as never);

	const watching = repository.watchSession('session-1', jest.fn());
	await Promise.resolve();
	await Promise.resolve();
	harness.status('CHANNEL_ERROR');
	await expect(watching).rejects.toThrow('Cloud updates are temporarily unavailable.');

	expect(harness.removeChannel).toHaveBeenCalledWith(harness.channel);
	const retry = repository.watchSession('session-1', jest.fn());
	await Promise.resolve();
	await Promise.resolve();
	expect(harness.client.channel).toHaveBeenCalledTimes(2);
	harness.status('SUBSCRIBED');
	await retry;
});

it('omits provider object paths from public file records', async () => {
	const upload = jest.fn(async () => ({ error: null }));
	const single = jest.fn(async () => ({
		data: {
			id: 'file-1',
			session_id: 'session-1',
			object_path: 'owner-1/sessions/session-1/file-1/private.txt',
			file_name: 'private.txt',
			mime_type: 'text/plain',
			size_bytes: 3,
			created_at: '2026-09-03T00:00:00.000Z',
		},
		error: null,
	}));
	const select = jest.fn(() => ({ single }));
	const insert = jest.fn(() => ({ select }));
	const repository = new SupabaseCloudRepository({
		storage: { from: jest.fn(() => ({ upload })) },
		from: jest.fn(() => ({ insert })),
	} as never);

	const file = await repository.uploadFile('owner-1', {
		id: 'file-1',
		sessionId: 'session-1',
		fileName: 'private.txt',
		mimeType: 'text/plain',
		data: new Uint8Array([1, 2, 3]).buffer,
	});

	expect(file).toEqual({
		id: 'file-1',
		sessionId: 'session-1',
		fileName: 'private.txt',
		mimeType: 'text/plain',
		sizeBytes: 3,
		createdAt: '2026-09-03T00:00:00.000Z',
	});
	expect(JSON.stringify(file)).not.toContain('owner-1/sessions');
});
