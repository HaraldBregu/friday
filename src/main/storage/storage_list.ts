import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { StorageObjectInfo } from '../../shared/storage_types';
import { storageClient } from './storage_client';

export async function listObjects(id: string, prefix?: string): Promise<StorageObjectInfo[]> {
	const { client, bucket } = storageClient(id);
	const objects: StorageObjectInfo[] = [];
	let continuationToken: string | undefined;
	do {
		const response = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				...(prefix ? { Prefix: prefix } : {}),
				...(continuationToken ? { ContinuationToken: continuationToken } : {}),
			})
		);
		objects.push(
			...(response.Contents ?? []).map((item) => ({
				key: item.Key ?? '',
				size: item.Size ?? 0,
				lastModified: item.LastModified?.toISOString(),
			}))
		);
		continuationToken = response.NextContinuationToken;
		if (response.IsTruncated && !continuationToken) {
			throw new Error('Storage returned an incomplete object listing.');
		}
	} while (continuationToken);
	return objects;
}
