import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { StorageObjectInfo } from '../../shared/storage_types';
import type { AuthService } from '../cloud/auth';

export async function listObjects(auth: AuthService, prefix = ''): Promise<StorageObjectInfo[]> {
	const state = auth.getState();
	if ((state.status !== 'signedIn' && state.status !== 'recovery') || !state.user) {
		throw new Error('Sign in to use sync.');
	}
	const root = `${state.user.id}/backups/${prefix}`.replace(/\/+$/, '');
	const pending = [root];
	const objects: StorageObjectInfo[] = [];
	while (pending.length > 0) {
		const folder = pending.shift();
		if (!folder) continue;
		let offset = 0;
		for (;;) {
			const { data, error } = await auth
				.getClient()
				.storage.from('user-files')
				.list(folder, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
			if (error) throw error;
			for (const entry of data) {
				const remotePath = `${folder}/${entry.name}`;
				if (entry.id === null) {
					pending.push(remotePath);
					continue;
				}
				objects.push({
					key: remotePath.slice(`${state.user.id}/backups/`.length),
					size: Number(entry.metadata?.size ?? 0),
					lastModified: entry.updated_at ?? undefined,
				});
			}
			if (data.length < 100) break;
			offset += data.length;
		}
	}
	return objects;
}
