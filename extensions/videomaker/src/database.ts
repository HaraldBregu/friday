export async function openDatabase(): Promise<IDBDatabase> {
	const request = indexedDB.open('friday-videomaker', 1);
	return new Promise((resolve, reject) => {
		request.onupgradeneeded = () => {
			if (!request.result.objectStoreNames.contains('media')) {
				request.result.createObjectStore('media');
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}
