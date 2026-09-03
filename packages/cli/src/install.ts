import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { kucedrDataDirectory } from './data.js';
import { validatePluginEntries } from './entries.js';
import { preparePluginSource } from './fetch.js';
import { readPluginManifest } from './manifest.js';
import type { InstallOptions, InstallResult } from './types.js';

export async function installPlugin(
	spec: string,
	options: InstallOptions = {}
): Promise<InstallResult> {
	if (!spec.trim()) throw new Error('A plugin package or directory is required.');

	const source = await preparePluginSource(spec);
	let stagingDirectory: string | undefined;
	let backupDirectory: string | undefined;

	try {
		const manifest = await readPluginManifest(source.directory);
		await validatePluginEntries(source.directory, manifest);

		const dataDirectory = path.resolve(options.dataDir ?? kucedrDataDirectory());
		const pluginsDirectory = path.join(dataDirectory, 'plugins');
		const destination = path.join(pluginsDirectory, manifest.id);
		await fs.mkdir(pluginsDirectory, { recursive: true });

		let destinationExists = true;
		try {
			await fs.access(destination);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') destinationExists = false;
			else throw error;
		}
		if (destinationExists && !options.force) {
			throw new Error(`Plugin "${manifest.id}" is already installed. Use --force to replace it.`);
		}

		stagingDirectory = path.join(pluginsDirectory, `.install-${randomUUID()}`);
		await fs.cp(source.directory, stagingDirectory, {
			recursive: true,
			errorOnExist: true,
			force: false,
			verbatimSymlinks: true,
		});
		await validatePluginEntries(stagingDirectory, manifest);

		if (options.force && destinationExists) {
			backupDirectory = path.join(pluginsDirectory, `.backup-${randomUUID()}`);
			await fs.rename(destination, backupDirectory);
		}

		try {
			await fs.rename(stagingDirectory, destination);
			stagingDirectory = undefined;
		} catch (error) {
			if (backupDirectory) await fs.rename(backupDirectory, destination);
			backupDirectory = undefined;
			throw error;
		}

		if (backupDirectory) {
			await fs.rm(backupDirectory, { recursive: true, force: true });
			backupDirectory = undefined;
		}

		return {
			id: manifest.id,
			name: manifest.name,
			version: manifest.version,
			destination,
			restartRequired: true,
		};
	} finally {
		if (stagingDirectory) {
			await fs.rm(stagingDirectory, { recursive: true, force: true });
		}
		if (backupDirectory) {
			await fs.rm(backupDirectory, { recursive: true, force: true });
		}
		await source.dispose();
	}
}
