import { FilePlus2, Film, HelpCircle, Plus, Share2 } from 'lucide-react';

import { canvasPresets } from '../defaults';
import type { Project } from '../types';

interface HeaderProps {
	project: Project;
	exporting: boolean;
	onName: (name: string) => void;
	onPreset: (width: number, height: number) => void;
	onImport: () => void;
	onAddText: () => void;
	onDocs: () => void;
	onExport: () => void;
}

export function Header({
	project,
	exporting,
	onName,
	onPreset,
	onImport,
	onAddText,
	onDocs,
	onExport,
}: HeaderProps) {
	const preset = canvasPresets.find(
		(candidate) => candidate.width === project.width && candidate.height === project.height
	);
	return (
		<header className="app-header">
			<div className="brand" aria-label="Video Maker">
				<span className="brand-mark" aria-hidden="true">
					<Film size={15} />
				</span>
				<strong>Video Maker</strong>
			</div>
			<input
				className="project-name"
				value={project.name}
				onChange={(event) => onName(event.target.value)}
				aria-label="Project name"
			/>
			<select
				className="preset-select"
				value={preset?.label ?? ''}
				onChange={(event) => {
					const next = canvasPresets.find((candidate) => candidate.label === event.target.value);
					if (next) onPreset(next.width, next.height);
				}}
				aria-label="Canvas format"
			>
				{canvasPresets.map((candidate) => (
					<option key={candidate.label}>{candidate.label}</option>
				))}
			</select>
			<div className="header-spacer" />
			<button
				className="icon-button help-button"
				onClick={onDocs}
				aria-label="Open Remotion docs"
				title="Remotion docs"
			>
				<HelpCircle size={16} />
			</button>
			<button onClick={onImport}>
				<FilePlus2 size={15} /> Import
			</button>
			<button onClick={onAddText}>
				<Plus size={15} /> Text
			</button>
			<button className="primary" disabled={exporting} onClick={onExport}>
				<Share2 size={15} /> {exporting ? 'Exporting…' : 'Export MP4'}
			</button>
		</header>
	);
}
