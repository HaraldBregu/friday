import { Captions, Image, Music2, Video } from 'lucide-react';

import { formatTime } from '../time';
import type { Project } from '../types';

interface TimelineProps {
	project: Project;
	duration: number;
	currentTime: number;
	selectedId: string | null;
	onSelect: (id: string) => void;
	onSeek: (seconds: number) => void;
}

export function Timeline({
	project,
	duration,
	currentTime,
	selectedId,
	onSelect,
	onSeek,
}: TimelineProps) {
	const marks = Array.from({ length: Math.ceil(duration) + 1 }, (_, index) => index);
	return (
		<section className="timeline-panel" aria-label="Timeline">
			<div className="timeline-toolbar">
				<strong>Timeline</strong>
				<span>{project.clips.length} layers</span>
				<div className="timeline-spacer" />
				<output>
					{formatTime(currentTime)} / {formatTime(duration)}
				</output>
			</div>
			<div className="timeline-grid">
				<div className="timeline-labels">
					<div className="ruler-label">Layer</div>
					{project.clips.map((clip) => (
						<button
							key={clip.id}
							className={selectedId === clip.id ? 'selected' : ''}
							onClick={() => onSelect(clip.id)}
						>
							{clip.kind === 'video' ? (
								<Video size={14} />
							) : clip.kind === 'image' ? (
								<Image size={14} />
							) : clip.kind === 'audio' ? (
								<Music2 size={14} />
							) : (
								<Captions size={14} />
							)}
							<span>{clip.name}</span>
						</button>
					))}
				</div>
				<div
					className="timeline-canvas"
					onPointerDown={(event) => {
						if ((event.target as HTMLElement).closest('.clip-bar')) return;
						const bounds = event.currentTarget.getBoundingClientRect();
						onSeek(((event.clientX - bounds.left) / bounds.width) * duration);
					}}
				>
					<div className="ruler">
						{marks.map((mark) => (
							<span key={mark} style={{ left: `${(mark / duration) * 100}%` }}>
								<i />
								{mark}s
							</span>
						))}
					</div>
					{project.clips.map((clip) => (
						<div key={clip.id} className="track-row">
							<button
								className={`clip-bar ${clip.kind} ${selectedId === clip.id ? 'selected' : ''}`}
								style={{
									left: `${(clip.start / duration) * 100}%`,
									width: `${Math.max(1.5, (clip.duration / duration) * 100)}%`,
								}}
								onPointerDown={(event) => event.stopPropagation()}
								onClick={() => onSelect(clip.id)}
								title={`${clip.name} · ${clip.start.toFixed(1)}s–${(clip.start + clip.duration).toFixed(1)}s`}
							>
								<span>{clip.name}</span>
							</button>
						</div>
					))}
					<div
						className="playhead"
						style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }}
						aria-hidden="true"
					>
						<i />
					</div>
				</div>
			</div>
		</section>
	);
}
