import { watch } from 'chokidar';
import { extensionsRoot } from './extension_root';

const updateDelay = 150;

export function watchExtensions(
	onChange: () => void,
	onError: (error: unknown) => void,
	appLocation?: string
): () => Promise<void> {
	let updateTimer: ReturnType<typeof setTimeout> | undefined;
	let stopped = false;
	const watcher = watch(extensionsRoot(appLocation), {
		ignoreInitial: true,
		followSymlinks: false,
		awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 25 },
	});

	watcher.on('all', () => {
		if (stopped) return;
		if (updateTimer) clearTimeout(updateTimer);
		updateTimer = setTimeout(onChange, updateDelay);
	});
	watcher.on('error', onError);

	return async (): Promise<void> => {
		stopped = true;
		if (updateTimer) clearTimeout(updateTimer);
		await watcher.close();
	};
}
