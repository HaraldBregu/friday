import { lstatSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import Store from 'electron-store';
import type { ExtensionStoreValue } from '../../shared/extension_store_types';
import { isExtensionStoreValue } from '../../shared/extension_store_value';
import { isExtensionId } from './extension_id';

type ExtensionStoreState = Record<string, ExtensionStoreValue>;

export class ExtensionValueStorage {
	private readonly stores = new Map<string, Store<ExtensionStoreState>>();

	constructor(private readonly root: string) {}

	get<T extends ExtensionStoreValue = ExtensionStoreValue>(
		extensionId: string,
		key: string
	): T | undefined {
		this.validateKey(key);
		return this.store(extensionId).get(key) as T | undefined;
	}

	set(extensionId: string, key: string, value: ExtensionStoreValue): void {
		this.validateKey(key);
		if (!isExtensionStoreValue(value)) throw new Error('Invalid extension store value.');
		this.store(extensionId).set(key, value);
	}

	delete(extensionId: string, key: string): void {
		this.validateKey(key);
		this.store(extensionId).delete(key);
	}

	private store(extensionId: string): Store<ExtensionStoreState> {
		const existing = this.stores.get(extensionId);
		if (existing) {
			this.assertStoreFile(existing.path);
			return existing;
		}

		const directory = this.ensureDirectory(extensionId);
		const storePath = path.join(directory, 'store.json');
		this.assertStoreFile(storePath);
		const created = new Store<ExtensionStoreState>({
			name: 'store',
			cwd: directory,
			accessPropertiesByDotNotation: false,
			clearInvalidConfig: false,
			configFileMode: 0o600,
		});
		this.stores.set(extensionId, created);
		return created;
	}

	private ensureDirectory(extensionId: string): string {
		const directory = this.namespace(extensionId);
		mkdirSync(this.root, { recursive: true });
		this.assertDirectory(this.root);
		try {
			mkdirSync(directory);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
		}
		this.assertDirectory(directory);
		return directory;
	}

	private namespace(extensionId: string): string {
		if (!isExtensionId(extensionId)) throw new Error('Invalid extension ID.');
		return path.join(this.root, extensionId);
	}

	private assertDirectory(directory: string): void {
		const stats = lstatSync(directory);
		if (stats.isSymbolicLink() || !stats.isDirectory()) {
			throw new Error('Invalid extension storage directory.');
		}
	}

	private assertStoreFile(filePath: string): void {
		try {
			const stats = lstatSync(filePath);
			if (stats.isSymbolicLink() || !stats.isFile()) {
				throw new Error('Invalid extension store file.');
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		}
	}

	private validateKey(key: string): void {
		if (
			typeof key !== 'string' ||
			key.length === 0 ||
			key.includes('\0') ||
			key === '__proto__' ||
			key === 'constructor' ||
			key === 'prototype' ||
			key === '__internal__' ||
			key.startsWith('__internal__.')
		) {
			throw new Error('Invalid extension store key.');
		}
	}
}
