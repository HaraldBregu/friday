import { Command } from 'commander';
import type { CliDependencies } from './types.js';

export function createProgram(dependencies: CliDependencies): Command {
	const program = new Command();
	program
		.name('kucedr')
		.description('Launch Kucedr and manage its plugins')
		.version('0.1.0')
		.action(async () => {
			await dependencies.launch();
		});

	program
		.command('app')
		.description('Launch the Kucedr desktop app')
		.action(async () => {
			await dependencies.launch();
		});

	program
		.command('install')
		.alias('/install')
		.description('Install a Kucedr plugin from npm or a local directory')
		.argument('<package>', 'npm package spec or local directory')
		.option('-f, --force', 'replace an installed plugin with the same id')
		.option('--data-dir <path>', 'override the Kucedr user-data directory')
		.action(async (spec: string, options: { dataDir?: string; force?: boolean }) => {
			const result = await dependencies.install(spec, options);
			process.stdout.write(
				`Installed ${result.name} ${result.version} at ${result.destination}\n` +
					'Restart Kucedr to activate the plugin.\n'
			);
		});

	program
		.command('tui')
		.description('Open the interactive Kucedr terminal interface')
		.action(async () => {
			await dependencies.tui();
		});

	return program;
}
