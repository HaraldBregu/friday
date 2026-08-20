import type { Project } from './types';

export function getProjectDuration(project: Project): number {
	return Math.max(1, ...project.clips.map((clip) => clip.start + clip.duration));
}
