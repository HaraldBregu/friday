import { powerSaveBlocker } from 'electron';

let blockerId: number | null = null;

export function setKeepAwake(enabled: boolean): void {
	if (enabled) {
		if (blockerId === null || !powerSaveBlocker.isStarted(blockerId)) {
			blockerId = powerSaveBlocker.start('prevent-display-sleep');
		}
		return;
	}

	if (blockerId !== null) {
		if (powerSaveBlocker.isStarted(blockerId)) powerSaveBlocker.stop(blockerId);
		blockerId = null;
	}
}
