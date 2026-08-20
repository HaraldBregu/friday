import { app, isFriday } from '@friday/sdk';

import { openDatabase } from './database';

export async function storeMedia(id: string, file: File): Promise<string> {
	const assetPath = `media/${id}`;
	if (isFriday()) {
		await app.writeExtensionStoreFile(assetPath, new Uint8Array(await file.arrayBuffer()));
		return assetPath;
	}
	const database = await openDatabase();
	const transaction = database.transaction('media', 'readwrite');
	transaction.objectStore('media').put(file, assetPath);
	await new Promise<void>((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error);
		transaction.onabort = () => reject(transaction.error);
	});
	database.close();
	return assetPath;
}
