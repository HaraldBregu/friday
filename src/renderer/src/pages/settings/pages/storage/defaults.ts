import type { StorageConfig } from '@shared/storage_types';

export const DEFAULT_STORAGE: StorageConfig = {
	id: 'supabase',
	name: 'Supabase',
	endpoint:
		import.meta.env?.VITE_STORAGE_ENDPOINT ||
		'https://avlnxreqkzszsznjhphr.storage.supabase.co/storage/v1/s3',
	region: import.meta.env?.VITE_STORAGE_REGION || 'eu-west-1',
	accessKeyId: import.meta.env?.VITE_STORAGE_ACCESS_KEY_ID || '',
	secretAccessKey: import.meta.env?.VITE_STORAGE_SECRET_ACCESS_KEY || '',
	bucket: import.meta.env?.VITE_STORAGE_BUCKET || '',
	forcePathStyle: true,
	paths: [],
	syncEnabled: false,
	syncCronExpression: '0 3 * * *',
};
