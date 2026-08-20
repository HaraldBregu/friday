import { app, isFriday, type ExtensionStoreValue } from '@friday/sdk';

import type { Project } from './types';

export async function saveProject(project: Project): Promise<void> {
	const stored = {
		...project,
		clips: project.clips.map((clip) => ({ ...clip, src: '' })),
	};
	if (isFriday()) {
		await app.setExtensionStoreValue('project-v1', stored as unknown as ExtensionStoreValue);
		return;
	}
	localStorage.setItem('friday-videomaker-project-v1', JSON.stringify(stored));
}
