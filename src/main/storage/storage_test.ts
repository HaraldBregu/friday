import { HeadBucketCommand } from '@aws-sdk/client-s3';
import type { StorageConfig, StorageTestResult } from '../../shared/storage_types';
import { createStorageClient } from './storage_client';
import { normalizeStorageConfig } from './storage_config';
import { describeStorageError } from './storage_error';

export async function testConnection(config: StorageConfig): Promise<StorageTestResult> {
	try {
		const normalized = normalizeStorageConfig(config);
		const client = createStorageClient(normalized);
		await client.send(new HeadBucketCommand({ Bucket: normalized.bucket }));
		return { ok: true };
	} catch (error) {
		return { ok: false, error: describeStorageError(error) };
	}
}
