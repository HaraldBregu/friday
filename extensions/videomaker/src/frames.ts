import type { Project } from './types';

export function getProjectDurationInFrames(project: Project): number {
	return Math.max(
		1,
		...project.clips.map((clip) => Math.ceil((clip.start + clip.duration) * project.fps))
	);
}
