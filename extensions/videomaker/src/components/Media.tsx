import { FileAudio2, FileImage, FileVideo2, Upload } from 'lucide-react';

import type { Clip } from '../types';

interface MediaProps {
	clips: Clip[];
	selectedId: string | null;
	onSelect: (id: string) => void;
	onImport: () => void;
	onFiles: (files: File[]) => void;
}

export function Media({ clips, selectedId, onSelect, onImport, onFiles }: MediaProps) {
	const media = clips.filter((clip) => clip.kind !== 'text');
	return (
		<aside className="media-panel" aria-label="Media library">
			<div className="panel-heading">
				<div>
					<strong>Media</strong>
					<span>{media.length} assets</span>
				</div>
			</div>
			<div
				className="drop-zone"
				onDragOver={(event) => event.preventDefault()}
				onDrop={(event) => {
					event.preventDefault();
					onFiles(Array.from(event.dataTransfer.files));
				}}
			>
				<Upload size={18} aria-hidden="true" />
				<strong>Drop media here</strong>
				<span>Video, image, or audio</span>
				<button onClick={onImport}>Browse files</button>
			</div>
			<div className="asset-list">
				{media.length === 0 ? (
					<p className="empty-copy">Imported media will appear here.</p>
				) : (
					media.map((clip) => (
						<button
							key={clip.id}
							className={`asset-item ${selectedId === clip.id ? 'selected' : ''}`}
							onClick={() => onSelect(clip.id)}
						>
							<span className={`asset-icon ${clip.kind}`} aria-hidden="true">
								{clip.kind === 'video' ? (
									<FileVideo2 size={16} />
								) : clip.kind === 'image' ? (
									<FileImage size={16} />
								) : (
									<FileAudio2 size={16} />
								)}
							</span>
							<span>
								<strong>{clip.name}</strong>
								<small>{clip.kind} · {clip.duration.toFixed(1)}s</small>
							</span>
						</button>
					))
				)}
			</div>
		</aside>
	);
}
