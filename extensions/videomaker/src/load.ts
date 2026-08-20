import { app, isFriday } from '@friday/sdk';

import { defaultProject } from './defaults';
import type { Clip, Project } from './types';

export async function loadProject(): Promise<Project> {
	const stored = isFriday()
		? await app.getExtensionStoreValue('project-v1')
		: JSON.parse(localStorage.getItem('friday-videomaker-project-v1') ?? 'null');
	if (!stored || typeof stored !== 'object' || !Array.isArray((stored as Project).clips)) {
		return defaultProject;
	}
	const project = stored as unknown as Project;
	const clips = await Promise.all(
		project.clips.map(async (clip): Promise<Clip | null> => {
			if (clip.kind === 'text') return { ...clip, src: '' };
			if (!isFriday() || !clip.assetPath || !clip.mime) return null;
			try {
				const bytes = await app.readExtensionStoreFile(clip.assetPath);
				return {
					...clip,
					src: URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: clip.mime })),
				};
			} catch {
				return null;
			}
		})
	);
	return { ...project, clips: clips.filter((clip): clip is Clip => clip !== null) };
}
