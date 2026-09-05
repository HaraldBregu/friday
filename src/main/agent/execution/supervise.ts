import type { ChildProcess } from 'node:child_process';
import { processTreeAlive } from './alive';
import { terminateProcessTree } from './terminate';

export function superviseProcess(child: ChildProcess, signal?: AbortSignal): void {
	if (!signal) return;
	let timer: NodeJS.Timeout | undefined;
	const abort = (): void => terminateProcessTree(child);
	const release = (): void => {
		if (processTreeAlive(child)) return;
		signal.removeEventListener('abort', abort);
		if (timer) clearInterval(timer);
	};
	signal.addEventListener('abort', abort, { once: true });
	child.once('close', () => {
		release();
		if (processTreeAlive(child)) {
			timer = setInterval(release, 250);
			timer.unref?.();
		}
	});
	child.once('error', release);
	if (signal.aborted) abort();
}
