import { Check, Cloud, LoaderCircle } from 'lucide-react';

interface StatusProps {
	status: 'loading' | 'saving' | 'saved' | 'error';
	dimensions: string;
	fps: number;
}

export function Status({ status, dimensions, fps }: StatusProps) {
	return (
		<footer className="status-bar" aria-live="polite">
			<span className={status === 'error' ? 'status-error' : ''}>
				{status === 'saving' || status === 'loading' ? <LoaderCircle className="spin" size={12} /> : status === 'saved' ? <Check size={12} /> : <Cloud size={12} />}
				{status === 'loading' ? 'Opening project' : status === 'saving' ? 'Saving' : status === 'saved' ? 'Saved' : 'Save failed'}
			</span>
			<div />
			<span>{dimensions}</span>
			<span>{fps} fps</span>
			<span>Remotion web renderer</span>
		</footer>
	);
}
