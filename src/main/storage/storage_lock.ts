const activeProviders = new Set<string>();

export async function withStorageLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
	if (activeProviders.has(id)) throw new Error('A cloud operation is already running for this storage.');
	activeProviders.add(id);
	try {
		return await operation();
	} finally {
		activeProviders.delete(id);
	}
}
