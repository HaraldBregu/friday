import { LoaderCircle, X } from 'lucide-react';

interface ExportProps {
	progress: number;
	error: string;
	onCancel: () => void;
	onClose: () => void;
}

export function Export({ progress, error, onCancel, onClose }: ExportProps) {
	return (
		<div className="dialog-backdrop" role="presentation">
			<section
				className="export-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="export-title"
			>
				{error ? (
					<>
						<div className="dialog-icon error">
							<X size={20} />
						</div>
						<h2 id="export-title">Export failed</h2>
						<p>{error}</p>
						<button className="primary" onClick={onClose}>
							Close
						</button>
					</>
				) : (
					<>
						<div className="dialog-icon">
							<LoaderCircle className="spin" size={20} />
						</div>
						<h2 id="export-title">Rendering MP4</h2>
						<p>Keep this window open while Remotion encodes your video.</p>
						<div
							className="progress-track"
							role="progressbar"
							aria-label="Export progress"
							aria-valuemin={0}
							aria-valuemax={100}
							aria-valuenow={Math.round(progress * 100)}
						>
							<span style={{ width: `${Math.max(2, progress * 100)}%` }} />
						</div>
						<strong className="progress-label">{Math.round(progress * 100)}%</strong>
						<button onClick={onCancel}>Cancel export</button>
					</>
				)}
			</section>
		</div>
	);
}
