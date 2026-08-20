import { canRenderMediaOnWeb, renderMediaOnWeb } from '@remotion/web-renderer';

import { VideoComposition } from './composition';
import { getProjectDuration } from './duration';
import type { Project } from './types';

export async function renderProject(
	project: Project,
	onProgress: (progress: number) => void,
	signal: AbortSignal
): Promise<Blob> {
	const muted = !project.clips.some(
		(clip) => (clip.kind === 'audio' || clip.kind === 'video') && !clip.muted && clip.volume > 0
	);
	const support = await canRenderMediaOnWeb({
		container: 'mp4',
		videoCodec: 'h264',
		width: project.width,
		height: project.height,
		muted,
		videoBitrate: 'high',
		audioBitrate: 'high',
	});
	if (!support.canRender) throw new Error(support.issues.map((issue) => issue.message).join(' '));
	const { getBlob } = await renderMediaOnWeb({
		composition: {
			id: 'videomaker',
			component: VideoComposition,
			defaultProps: { project },
			durationInFrames: Math.max(1, Math.ceil(getProjectDuration(project) * project.fps)),
			fps: project.fps,
			width: project.width,
			height: project.height,
		},
		inputProps: { project },
		container: 'mp4',
		videoCodec: 'h264',
		muted,
		videoBitrate: 'high',
		audioBitrate: 'high',
		pageResponsiveness: 'high',
		onProgress: ({ progress }) => onProgress(progress),
		signal,
	});
	return getBlob();
}
