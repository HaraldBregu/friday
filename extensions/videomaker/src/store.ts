import { app, isFriday } from '@friday/sdk';

export async function storeMedia(id: string, file: File): Promise<string | null> {
	if (!isFriday()) return null;
	const assetPath = `media/${id}`;
	await app.writeExtensionStoreFile(assetPath, new Uint8Array(await file.arrayBuffer()));
	return assetPath;
}
