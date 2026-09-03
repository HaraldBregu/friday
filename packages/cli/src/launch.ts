import fs from 'node:fs';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';

export interface LaunchOptions {
	readonly env?: NodeJS.ProcessEnv;
	readonly exists?: (file: string) => boolean;
	readonly platform?: NodeJS.Platform;
	readonly spawn?: typeof spawn;
}

export interface LaunchTarget {
	readonly args: readonly string[];
	readonly command: string;
	readonly detached: boolean;
}

export function resolveLaunchTarget(options: LaunchOptions = {}): LaunchTarget {
	const env = options.env ?? process.env;
	const platform = options.platform ?? process.platform;
	const exists = options.exists ?? fs.existsSync;

	if (env.KUCEDR_APP_PATH) {
		return { command: env.KUCEDR_APP_PATH, args: [], detached: true };
	}

	if (platform === 'darwin') {
		return { command: 'open', args: ['-a', 'Kucedr'], detached: false };
	}

	if (platform === 'win32') {
		const candidates = [
			env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Programs', 'Kucedr', 'Kucedr.exe'),
			env.ProgramFiles && path.join(env.ProgramFiles, 'Kucedr', 'Kucedr.exe'),
			env['ProgramFiles(x86)'] && path.join(env['ProgramFiles(x86)'], 'Kucedr', 'Kucedr.exe'),
		].filter((candidate): candidate is string => Boolean(candidate));
		const executable = candidates.find(exists);
		if (executable) return { command: executable, args: [], detached: true };
		return {
			command: 'explorer.exe',
			args: ['shell:AppsFolder\\com.kucedr.kucedr'],
			detached: false,
		};
	}

	return { command: 'kucedr-desktop', args: [], detached: true };
}

export async function launchKucedr(options: LaunchOptions = {}): Promise<void> {
	const target = resolveLaunchTarget(options);
	const spawnProcess = options.spawn ?? spawn;
	const child = spawnProcess(target.command, [...target.args], {
		detached: target.detached,
		shell: false,
		stdio: 'ignore',
	});

	await new Promise<void>((resolve, reject) => {
		child.once('error', reject);
		if (target.detached) {
			child.once('spawn', resolve);
			return;
		}
		child.once('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`Could not launch Kucedr (exit code ${code ?? 'unknown'}).`));
		});
	});

	if (target.detached) (child as ChildProcess).unref();
}
