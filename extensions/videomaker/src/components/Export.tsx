import { LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ExportProps {
	progress: number;
	error: string;
	onCancel: () => void;
	onClose: () => void;
}

export function Export({ progress, error, onCancel, onClose }: ExportProps) {
	const dialogRef = useRef<HTMLElement>(null);
	const errorRef = useRef(error);
	errorRef.current = error;

	useEffect(() => {
		const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		return () => {
			window.setTimeout(() => previouslyFocused?.focus());
		};
	}, []);

	useEffect(() => {
		dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
	}, [error]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				if (errorRef.current) onClose();
				else onCancel();
				return;
			}
			if (event.key !== 'Tab') return;
			const buttons = Array.from(
				dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []
			);
			if (buttons.length === 0) return;
			const first = buttons[0];
			const last = buttons[buttons.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [onCancel, onClose]);

	return (
		<div className="dialog-backdrop" role="presentation">
			<section
				ref={dialogRef}
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
