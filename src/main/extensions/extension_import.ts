import { randomUUID } from 'node:crypto';
import { cpSync, existsSync, lstatSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { isExtensionId } from './extension_id';
import { extensionsRoot } from './extension_root';
import { readExtensionManifestFromDirectory } from './extension_read';
import type { ExtensionImportResult, ExtensionImportSkipped } from '../../shared/extension_types';
import type { Extension } from './extension_types';

function createSkipped(sourcePath: string, reason: string): ExtensionImportSkipped {
	return {
		name: path.basename(sourcePath),
		sourcePath,
		reason,
	};
}

function readExtension(directory: string): Extension | null {
	const id = path.basename(directory);
	const manifest = readExtensionManifestFromDirectory(directory);
	if (!manifest) return null;

	const entryPath = path.join(directory, manifest.metadata.entry);
	try {
		if (!existsSync(entryPath) || !statSync(entryPath).isFile()) return null;
	} catch {
		return null;
	}

	return { id, ...manifest };
}

export function importExtensions(sources: string[], appLocation?: string): ExtensionImportResult {
	const extensions: Extension[] = [];
	const skipped: ExtensionImportSkipped[] = [];
	const root = path.resolve(extensionsRoot(appLocation));
	mkdirSync(root, { recursive: true });

	for (const source of sources) {
		const sourcePath = path.resolve(source);
		const id = path.basename(sourcePath);
		if (!isExtensionId(id)) {
			skipped.push(createSkipped(source, 'Invalid extension folder name.'));
			continue;
		}

		if (
			!existsSync(sourcePath) ||
			lstatSync(sourcePath).isSymbolicLink() ||
			!statSync(sourcePath).isDirectory()
		) {
			skipped.push(createSkipped(source, 'Source folder is missing.'));
			continue;
		}

		const manifest = readExtension(sourcePath);
		if (!manifest) {
			skipped.push(
				createSkipped(
					source,
					'Missing or invalid manifest. Expected manifest.json or package.json.'
				)
			);
			continue;
		}

		const destination = path.join(root, id);
		if (sourcePath === destination) {
			skipped.push(createSkipped(source, 'Source folder is already installed.'));
			continue;
		}

		const token = randomUUID();
		const staging = path.join(root, `.${id}-${token}.import`);
		const backup = path.join(root, `.${id}-${token}.backup`);
		let movedExisting = false;
		try {
			cpSync(sourcePath, staging, { recursive: true, errorOnExist: true, force: false });
			if (!readExtension(staging)) throw new Error('Copied extension is invalid.');
			if (existsSync(destination)) {
				renameSync(destination, backup);
				movedExisting = true;
			}
			try {
				renameSync(staging, destination);
			} catch (error) {
				if (movedExisting) renameSync(backup, destination);
				throw error;
			}
			if (movedExisting) rmSync(backup, { recursive: true, force: true });
			extensions.push(manifest);
		} catch (error) {
			rmSync(staging, { recursive: true, force: true });
			if (movedExisting && !existsSync(destination) && existsSync(backup)) {
				renameSync(backup, destination);
			}
			skipped.push(
				createSkipped(
					source,
					`Unable to install extension: ${error instanceof Error ? error.message : String(error)}`
				)
			);
		}
	}

	return { imported: extensions, skipped };
}
