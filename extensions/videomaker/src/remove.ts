import { app, isFriday } from '@friday/sdk';

export async function removeMedia(assetPath: string | null): Promise<void> {
	if (assetPath && isFriday()) await app.deleteExtensionStoreFile(assetPath);
}
