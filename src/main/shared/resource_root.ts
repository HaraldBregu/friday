import { app } from 'electron';

export function resourceRoot(): string {
	return app.isPackaged ? process.resourcesPath : app.getAppPath();
}
