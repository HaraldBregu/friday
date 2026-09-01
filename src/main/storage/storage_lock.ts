let active = false;

export async function withStorageLock<T>(operation: () => Promise<T>): Promise<T> {
	if (active) throw new Error('A cloud operation is already running.');
	active = true;
	try {
		return await operation();
	} finally {
		active = false;
	}
}
