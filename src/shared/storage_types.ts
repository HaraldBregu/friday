export interface StorageSyncSettings {
	paths: string[];
	syncEnabled: boolean;
	syncCronExpression: string;
}

export interface StorageConfig extends StorageSyncSettings {
	id: string;
	name: string;
	endpoint: string;
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucket: string;
	forcePathStyle: boolean;
}

export interface StorageConfiguration {
	providerId: string | undefined;
	storageId: string | undefined;
	paths: StorageSyncSettings['paths'];
	syncEnabled: StorageSyncSettings['syncEnabled'];
	syncCronExpression: StorageSyncSettings['syncCronExpression'];
}

export interface StorageSyncFolder {
	key: 'agent' | 'sessions' | 'library' | 'wiki' | 'skills';
	path: string;
}

export interface StorageObjectInfo {
	key: string;
	size: number;
	lastModified: string | undefined;
}

export interface StorageTestResult {
	ok: boolean;
	error?: string;
}

export interface StorageSyncResult {
	uploaded: string[];
	skipped: string[];
}

export interface StoragePushFailure {
	path: string;
	error: string;
}

export interface StoragePushResult {
	uploaded: string[];
	failed: StoragePushFailure[];
}

export interface StoragePullResult {
	downloaded: string[];
	skipped: string[];
	failed: StoragePushFailure[];
}
