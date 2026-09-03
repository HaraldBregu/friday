import { getObject } from '../../../../src/main/storage/storage_get';
import { listObjects } from '../../../../src/main/storage/storage_list';
import { putObject } from '../../../../src/main/storage/storage_put';

const upload = jest.fn();
const download = jest.fn();
const list = jest.fn();
const from = jest.fn(() => ({ upload, download, list }));
const auth = {
	getState: jest.fn(() => ({
		status: 'signedIn',
		user: { id: '11111111-1111-4111-8111-111111111111' },
	})),
	getClient: jest.fn(() => ({ storage: { from } })),
} as never;

beforeEach(() => {
	jest.clearAllMocks();
});

it('uploads backups to the signed-in user prefix with overwrite enabled', async () => {
	upload.mockResolvedValue({ error: null });
	const data = new Uint8Array([1, 2, 3]);

	await putObject(auth, 'kucedr/v1/agent/note.md', data, 'text/markdown');

	expect(from).toHaveBeenCalledWith('user-files');
	expect(upload).toHaveBeenCalledWith(
		'11111111-1111-4111-8111-111111111111/backups/kucedr/v1/agent/note.md',
		data,
		{ contentType: 'text/markdown', upsert: true }
	);
});

it('downloads backups from the signed-in user prefix', async () => {
	download.mockResolvedValue({
		data: { arrayBuffer: async () => Uint8Array.from([4, 5]).buffer },
		error: null,
	});

	await expect(getObject(auth, 'kucedr/v1/agent/note.md')).resolves.toEqual(new Uint8Array([4, 5]));
	expect(download).toHaveBeenCalledWith(
		'11111111-1111-4111-8111-111111111111/backups/kucedr/v1/agent/note.md'
	);
});

it('recursively lists Supabase folders without exposing the user prefix', async () => {
	list
		.mockResolvedValueOnce({
			data: [{ id: null, name: 'notes', metadata: null, updated_at: null }],
			error: null,
		})
		.mockResolvedValueOnce({
			data: [
				{
					id: 'object-1',
					name: 'today.md',
					metadata: { size: 12 },
					updated_at: '2026-09-01T12:00:00.000Z',
				},
			],
			error: null,
		});

	await expect(listObjects(auth, 'kucedr/v1/agent/')).resolves.toEqual([
		{
			key: 'kucedr/v1/agent/notes/today.md',
			size: 12,
			lastModified: '2026-09-01T12:00:00.000Z',
		},
	]);
	expect(list).toHaveBeenNthCalledWith(
		1,
		'11111111-1111-4111-8111-111111111111/backups/kucedr/v1/agent',
		expect.objectContaining({ limit: 100, offset: 0 })
	);
	expect(list).toHaveBeenNthCalledWith(
		2,
		'11111111-1111-4111-8111-111111111111/backups/kucedr/v1/agent/notes',
		expect.objectContaining({ limit: 100, offset: 0 })
	);
});

it('requires a signed-in user before accessing storage', async () => {
	const signedOut = {
		getState: () => ({ status: 'signedOut' }),
		getClient: jest.fn(),
	} as never;

	await expect(putObject(signedOut, 'kucedr/v1/file', new Uint8Array())).rejects.toThrow(
		'Sign in to use sync'
	);
});
