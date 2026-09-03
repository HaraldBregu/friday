import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { x as extractTar } from 'tar';
import { run } from './run.js';

export interface PreparedPluginSource {
	readonly directory: string;
	readonly dispose: () => Promise<void>;
}

interface PackResult {
	readonly filename?: string;
}

export async function preparePluginSource(spec: string): Promise<PreparedPluginSource> {
	const localPath = path.resolve(spec);
	try {
		if ((await fs.stat(localPath)).isDirectory()) {
			return { directory: localPath, dispose: async () => undefined };
		}
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
	}

	const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'kucedr-cli-'));
	const dispose = async (): Promise<void> => {
		await fs.rm(temporaryDirectory, { recursive: true, force: true });
	};

	try {
		const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
		const result = await run(
			npm,
			[
				'pack',
				spec,
				'--json',
				'--ignore-scripts',
				'--cache',
				path.join(temporaryDirectory, '.npm-cache'),
				'--pack-destination',
				temporaryDirectory,
			],
			temporaryDirectory
		);
		const output = JSON.parse(result.stdout) as PackResult[];
		const filename = output[0]?.filename;
		if (!filename) throw new Error('npm did not return a package archive.');

		const archivePath = path.resolve(temporaryDirectory, filename);
		if (!archivePath.startsWith(`${temporaryDirectory}${path.sep}`)) {
			throw new Error('npm returned an archive outside the staging directory.');
		}

		const directory = path.join(temporaryDirectory, 'package');
		await fs.mkdir(directory);
		await extractTar({
			cwd: directory,
			file: archivePath,
			preservePaths: false,
			strict: true,
			strip: 1,
		});
		return { directory, dispose };
	} catch (error) {
		await dispose();
		throw error;
	}
}
