import { app, isFriday } from '@friday/sdk';

import { defaultProject } from './defaults';
import { readMedia } from './read';
import type { Project } from './types';

export async function loadProject(): Promise<Project> {
	const stored = isFriday()
		? await app.getExtensionStoreValue('project-v1')
		: JSON.parse(localStorage.getItem('friday-videomaker-project-v1') ?? 'null');
	if (!stored || typeof stored !== 'object' || !Array.isArray((stored as Project).clips)) {
		return defaultProject;
	}
	const project = stored as unknown as Project;
	const clips = await Promise.all(
		project.clips.map(async (clip) => {
			if (clip.kind === 'text') return { ...clip, src: '', available: true };
			if (!clip.assetPath || !clip.mime) return { ...clip, src: '', available: false };
			try {
				return {
					...clip,
					src: await readMedia(clip.assetPath, clip.mime),
					available: true,
				};
			} catch {
				return { ...clip, src: '', available: false };
			}
		})
	);
	return { ...project, clips };
}
