import { listObjects } from '../../../../src/main/storage/storage_list';
import { storageClient } from '../../../../src/main/storage/storage_client';

jest.mock('../../../../src/main/storage/storage_client', () => ({
	storageClient: jest.fn(),
}));

const mockStorageClient = jest.mocked(storageClient);

describe('listObjects', () => {
	it('collects every page from an S3-compatible provider', async () => {
		const send = jest
			.fn()
			.mockResolvedValueOnce({
				Contents: [{ Key: 'friday/v1/agent/one.md', Size: 3 }],
				IsTruncated: true,
				NextContinuationToken: 'page-2',
			})
			.mockResolvedValueOnce({
				Contents: [{ Key: 'friday/v1/agent/two.md', Size: 4 }],
				IsTruncated: false,
			});
		mockStorageClient.mockReturnValue({ client: { send }, bucket: 'friday' } as never);

		await expect(listObjects('backup', 'friday/v1/agent/')).resolves.toEqual([
			{ key: 'friday/v1/agent/one.md', size: 3, lastModified: undefined },
			{ key: 'friday/v1/agent/two.md', size: 4, lastModified: undefined },
		]);
		expect(send).toHaveBeenCalledTimes(2);
		expect(send.mock.calls[1]?.[0].input).toMatchObject({ ContinuationToken: 'page-2' });
	});

	it('rejects a truncated page without a continuation token', async () => {
		mockStorageClient.mockReturnValue({
			client: { send: jest.fn().mockResolvedValue({ IsTruncated: true }) },
			bucket: 'friday',
		} as never);

		await expect(listObjects('backup')).rejects.toThrow('incomplete object listing');
	});
});
