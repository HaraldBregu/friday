import { app, isKucedr, type ExtensionStoreValue } from '@kucedr/sdk';

import type { Project } from './types';

export async function saveProject(project: Project): Promise<void> {
	const stored = {
		...project,
		clips: project.clips.map((clip) => ({ ...clip, src: '' })),
	};
	if (isKucedr()) {
		await app.setExtensionStoreValue('project-v1', stored as unknown as ExtensionStoreValue);
		return;
	}
	localStorage.setItem('kucedr-videomaker-project-v1', JSON.stringify(stored));
}
