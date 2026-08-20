import type { PlayerRef } from '@remotion/player';
import { Player } from '@remotion/player';
import { memo, type RefObject } from 'react';
import type { AnyZodObject } from 'remotion';

import { VideoComposition, type CompositionProps } from '../composition';
import { getProjectDuration } from '../duration';

interface PreviewProps {
	inputProps: CompositionProps;
	playerRef: RefObject<PlayerRef | null>;
}

export const Preview = memo(function Preview({ inputProps, playerRef }: PreviewProps) {
	const { project } = inputProps;
	return (
		<section className="preview-panel" aria-label="Video preview">
			<div className="preview-stage">
				<div className="player-shell" style={{ aspectRatio: `${project.width} / ${project.height}` }}>
					<Player<AnyZodObject, CompositionProps>
						ref={playerRef}
						component={VideoComposition}
						inputProps={inputProps}
						durationInFrames={Math.max(1, Math.ceil(getProjectDuration(project) * project.fps))}
						compositionWidth={project.width}
						compositionHeight={project.height}
						fps={project.fps}
						controls
						showVolumeControls
						spaceKeyToPlayOrPause
						clickToPlay
						style={{ width: '100%', height: '100%' }}
					/>
				</div>
			</div>
		</section>
	);
});
