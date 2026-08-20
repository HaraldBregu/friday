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

export type StorageOperation = 'backup' | 'restore';
export type StorageOperationTrigger = 'manual' | 'scheduled';
export type StorageOperationState = 'running' | 'succeeded' | 'partial' | 'failed';

export interface StorageOperationStatus {
	operationId: string;
	storageId: string;
	operation: StorageOperation;
	trigger: StorageOperationTrigger;
	state: StorageOperationState;
	startedAt: string;
	finishedAt?: string;
	transferred: number;
	skipped: number;
	failed: number;
	error?: string;
	revision: number;
}
