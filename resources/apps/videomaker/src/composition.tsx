import { Audio, Video } from '@remotion/media';
import { AbsoluteFill, Img, interpolate, Sequence, useCurrentFrame } from 'remotion';

import type { Project } from './types';

export type CompositionProps = {
	project: Project;
};

export function VideoComposition({ project }: CompositionProps) {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{ backgroundColor: project.background, overflow: 'hidden' }}>
			{project.clips.map((clip) => {
				if (!clip.available) return null;
				const from = Math.max(0, Math.round(clip.start * project.fps));
				const end = Math.max(from + 1, Math.ceil((clip.start + clip.duration) * project.fps));
				const durationInFrames = end - from;
				const fade = Math.max(1, Math.min(12, Math.floor(durationInFrames / 3)));
				const opacity = interpolate(frame, [from, from + fade, end - fade, end], [0, 1, 1, 0], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});
				if (clip.kind === 'audio') {
					return (
						<Audio
							key={clip.id}
							from={from}
							durationInFrames={durationInFrames}
							src={clip.src}
							muted={clip.muted}
							volume={clip.volume}
						/>
					);
				}
				if (clip.kind === 'video') {
					return (
						<Video
							key={clip.id}
							from={from}
							durationInFrames={durationInFrames}
							src={clip.src}
							muted={clip.muted}
							volume={clip.volume}
							objectFit={clip.fit}
							style={{ width: '100%', height: '100%', opacity }}
						/>
					);
				}
				return (
					<Sequence key={clip.id} from={from} durationInFrames={durationInFrames}>
						<AbsoluteFill
							style={{
								alignItems: 'center',
								justifyContent: 'center',
								opacity,
							}}
						>
							{clip.kind === 'image' ? (
								<Img
									src={clip.src}
									style={{ width: '100%', height: '100%', objectFit: clip.fit }}
								/>
							) : (
								<div
									style={{
										maxWidth: '82%',
										color: clip.color,
										fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
										fontSize: clip.fontSize,
										fontWeight: 750,
										letterSpacing: '-0.035em',
										lineHeight: 1.04,
										textAlign: 'center',
										textShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
										whiteSpace: 'pre-wrap',
									}}
								>
									{clip.text}
								</div>
							)}
						</AbsoluteFill>
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
}
