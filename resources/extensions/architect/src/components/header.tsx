import { Building2, RotateCcw } from 'lucide-react';

interface HeaderProps {
	model: string;
	connected: boolean;
	hasImage: boolean;
	onReset: () => void;
}

export function Header({ model, connected, hasImage, onReset }: HeaderProps) {
	return (
		<header className="app-header">
			<div className="brand-mark" aria-hidden="true">
				<Building2 size={16} strokeWidth={2} />
			</div>
			<div className="brand-copy">
				<strong>Architect</strong>
				<span>Interior image studio</span>
			</div>
			<div className="header-spacer" />
			<span className="model-pill" title={model}>
				<i className={connected ? 'online' : ''} />
				{connected ? model : 'Preview mode'}
			</span>
			<button className="icon-button" disabled={!hasImage} onClick={onReset} title="New project">
				<RotateCcw size={15} />
				<span className="sr-only">New project</span>
			</button>
		</header>
	);
}
