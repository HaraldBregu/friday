import { app } from '@friday/sdk';

export async function runStorageTest(): Promise<string[]> {
	const key = 'demo-storage-test';
	const path = 'demo-storage-test/message.txt';
	const createdValue = { phase: 'created', count: 1 };
	const updatedValue = { phase: 'updated', count: 2 };
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	try {
		await app.deleteExtensionStoreValue(key);
		await app.deleteExtensionStoreFile(path);

		if ((await app.getExtensionStoreValue(key)) !== undefined) {
			throw new Error('getExtensionStoreValue did not return undefined for a missing key');
		}

		await app.setExtensionStoreValue(key, createdValue);
		if (JSON.stringify(await app.getExtensionStoreValue(key)) !== JSON.stringify(createdValue)) {
			throw new Error('setExtensionStoreValue did not store the value');
		}

		await app.setExtensionStoreValue(key, updatedValue);
		if (JSON.stringify(await app.getExtensionStoreValue(key)) !== JSON.stringify(updatedValue)) {
			throw new Error('setExtensionStoreValue did not overwrite the value');
		}

		await app.deleteExtensionStoreValue(key);
		if ((await app.getExtensionStoreValue(key)) !== undefined) {
			throw new Error('deleteExtensionStoreValue did not remove the value');
		}

		let missingFileRejected = false;
		try {
			await app.readExtensionStoreFile(path);
		} catch {
			missingFileRejected = true;
		}
		if (!missingFileRejected) {
			throw new Error('readExtensionStoreFile did not reject a missing file');
		}

		await app.writeExtensionStoreFile(path, encoder.encode('created'));
		if (decoder.decode(await app.readExtensionStoreFile(path)) !== 'created') {
			throw new Error('writeExtensionStoreFile did not save the file');
		}

		await app.writeExtensionStoreFile(path, encoder.encode('updated'));
		if (decoder.decode(await app.readExtensionStoreFile(path)) !== 'updated') {
			throw new Error('writeExtensionStoreFile did not overwrite the file');
		}

		await app.deleteExtensionStoreFile(path);
		missingFileRejected = false;
		try {
			await app.readExtensionStoreFile(path);
		} catch {
			missingFileRejected = true;
		}
		if (!missingFileRejected) {
			throw new Error('deleteExtensionStoreFile did not remove the file');
		}

		return [
			'getExtensionStoreValue: missing, read, overwrite',
			'setExtensionStoreValue: create, overwrite',
			'deleteExtensionStoreValue: delete',
			'readExtensionStoreFile: missing, read, overwrite',
			'writeExtensionStoreFile: create, overwrite',
			'deleteExtensionStoreFile: delete',
		];
	} finally {
		await Promise.allSettled([
			app.deleteExtensionStoreValue(key),
			app.deleteExtensionStoreFile(path),
		]);
	}
}
