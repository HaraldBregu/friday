import { app, isKucedr, type AppStoreValue } from '@kucedr/sdk';

import type { Project } from './types';

export async function saveProject(project: Project): Promise<void> {
	const stored = {
		...project,
		clips: project.clips.map((clip) => ({ ...clip, src: '' })),
	};
	if (isKucedr()) {
		await app.setAppStoreValue('project-v1', stored as unknown as AppStoreValue);
		return;
	}
	localStorage.setItem('kucedr-videomaker-project-v1', JSON.stringify(stored));
}
