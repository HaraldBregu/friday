import { app, isKucedr } from '@kucedr/sdk';

import { openDatabase } from './database';

export async function readMedia(assetPath: string, mime: string): Promise<string> {
	if (isKucedr()) {
		const bytes = await app.readAppStoreFile(assetPath);
		return URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mime }));
	}
	const database = await openDatabase();
	const request = database.transaction('media', 'readonly').objectStore('media').get(assetPath);
	const blob = await new Promise<Blob>((resolve, reject) => {
		request.onsuccess = () =>
			request.result instanceof Blob
				? resolve(request.result)
				: reject(new Error('Media not found.'));
		request.onerror = () => reject(request.error);
	});
	database.close();
	return URL.createObjectURL(blob.slice(0, blob.size, mime));
}
