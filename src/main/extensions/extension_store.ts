import type { ExtensionStoreValue } from '../../shared/extension_store_types';
import { extensionDataRoot } from './extension_data_root';
import { ExtensionFileStorage } from './extension_files';
import { ExtensionValueStorage } from './extension_values';

export class ExtensionStorage {
	private readonly files: ExtensionFileStorage;
	private readonly values: ExtensionValueStorage;

	constructor(root = extensionDataRoot()) {
		this.files = new ExtensionFileStorage(root);
		this.values = new ExtensionValueStorage(root);
	}

	get<T extends ExtensionStoreValue = ExtensionStoreValue>(
		extensionId: string,
		key: string
	): T | undefined {
		return this.values.get<T>(extensionId, key);
	}

	set(extensionId: string, key: string, value: ExtensionStoreValue): void {
		this.values.set(extensionId, key, value);
	}

	delete(extensionId: string, key: string): void {
		this.values.delete(extensionId, key);
	}

	readFile(extensionId: string, filePath: string): Promise<Uint8Array> {
		return this.files.read(extensionId, filePath);
	}

	writeFile(extensionId: string, filePath: string, data: Uint8Array): Promise<void> {
		return this.files.write(extensionId, filePath, data);
	}

	deleteFile(extensionId: string, filePath: string): Promise<void> {
		return this.files.delete(extensionId, filePath);
	}
}
