import path from 'node:path';

export function sandboxSystemReads(): string[] {
	return [
		'/bin',
		'/sbin',
		'/usr',
		'/etc',
		'/dev',
		'/System',
		'/Library/Developer',
		'/private/etc',
		'/opt/homebrew',
		'/usr/local',
		'/nix/store',
		process.env.SystemRoot,
		path.dirname(process.execPath),
	].filter((value): value is string => Boolean(value));
}
