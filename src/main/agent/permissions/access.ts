import { AsyncLocalStorage } from 'node:async_hooks';

export interface AuthorizedPath {
	readonly path: string;
	readonly exists: boolean;
	readonly dev?: number;
	readonly ino?: number;
}

export const authorizedPaths = new AsyncLocalStorage<readonly AuthorizedPath[]>();
