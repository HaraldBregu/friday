import { powerSaveBlocker } from 'electron';

export function preventStorageSuspension(): () => void {
	const id = powerSaveBlocker.start('prevent-app-suspension');
	return () => {
		if (powerSaveBlocker.isStarted(id)) powerSaveBlocker.stop(id);
	};
}
