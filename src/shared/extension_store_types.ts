export type ExtensionStoreValue =
	| null
	| boolean
	| number
	| string
	| ExtensionStoreValue[]
	| { [key: string]: ExtensionStoreValue };

export interface ExtensionStorageApi {
	getExtensionStoreValue<T extends ExtensionStoreValue = ExtensionStoreValue>(
		key: string
	): Promise<T | undefined>;
	setExtensionStoreValue(key: string, value: ExtensionStoreValue): Promise<void>;
	deleteExtensionStoreValue(key: string): Promise<void>;
	readExtensionStoreFile(path: string): Promise<Uint8Array>;
	writeExtensionStoreFile(path: string, data: Uint8Array): Promise<void>;
	deleteExtensionStoreFile(path: string): Promise<void>;
}
