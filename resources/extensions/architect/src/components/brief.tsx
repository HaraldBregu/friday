import { Sparkles, Upload } from 'lucide-react';
import type { GenerationBrief } from '../types';

interface BriefProps {
	brief: GenerationBrief;
	disabled: boolean;
	connected: boolean;
	onChange: (field: keyof GenerationBrief, value: string) => void;
	onGenerate: () => void;
	onImport: (file: File) => void;
}

export function Brief({ brief, disabled, connected, onChange, onGenerate, onImport }: BriefProps) {
	return (
		<aside className="brief-panel panel">
			<div className="panel-title">
				<div>
					<strong>Design brief</strong>
					<span>Define the room and atmosphere</span>
				</div>
			</div>
			<div className="panel-scroll form-stack">
				<label>
					<span>Space</span>
					<select value={brief.room} onChange={(event) => onChange('room', event.target.value)}>
						<option>living room</option>
						<option>kitchen</option>
						<option>bedroom suite</option>
						<option>bathroom</option>
						<option>home office</option>
						<option>restaurant</option>
						<option>hotel lobby</option>
						<option>retail interior</option>
					</select>
				</label>
				<label>
					<span>What should it become?</span>
					<textarea
						rows={5}
						value={brief.description}
						placeholder="A quiet lakeside living room with a sunken seating area, sculptural fireplace, and uninterrupted views…"
						onChange={(event) => onChange('description', event.target.value)}
					/>
				</label>
				<label>
					<span>Style</span>
					<input value={brief.style} onChange={(event) => onChange('style', event.target.value)} />
				</label>
				<label>
					<span>Materials</span>
					<textarea
						rows={2}
						value={brief.materials}
						onChange={(event) => onChange('materials', event.target.value)}
					/>
				</label>
				<label>
					<span>Lighting</span>
					<textarea
						rows={2}
						value={brief.lighting}
						onChange={(event) => onChange('lighting', event.target.value)}
					/>
				</label>
				<fieldset>
					<legend>Frame</legend>
					<div className="segmented">
						{(['1:1', '4:3', '3:2', '16:9'] as const).map((ratio) => (
							<button
								key={ratio}
								type="button"
								className={brief.ratio === ratio ? 'active' : ''}
								onClick={() => onChange('ratio', ratio)}
							>
								{ratio}
							</button>
						))}
					</div>
				</fieldset>
			</div>
			<div className="panel-actions">
				<button className="primary" disabled={disabled || !connected} onClick={onGenerate}>
					<Sparkles size={15} /> Generate
				</button>
				<label className="button secondary">
					<Upload size={15} /> Import
					<input
						type="file"
						accept="image/png,image/jpeg,image/webp"
						onChange={(event) => {
							const file = event.target.files?.[0];
							if (file) onImport(file);
							event.target.value = '';
						}}
					/>
				</label>
			</div>
		</aside>
	);
}
