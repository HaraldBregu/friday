import { Trash2 } from 'lucide-react';

import type { Clip, Project } from '../types';

interface InspectorProps {
	project: Project;
	clip: Clip | null;
	onProject: (patch: Partial<Project>) => void;
	onClip: (patch: Partial<Clip>) => void;
	onRemove: () => void;
}

export function Inspector({ project, clip, onProject, onClip, onRemove }: InspectorProps) {
	return (
		<aside className="inspector" aria-label="Properties inspector">
			<div className="panel-heading">
				<div>
					<strong>Properties</strong>
					<span>{clip ? clip.kind : 'project'}</span>
				</div>
			</div>
			<div className="inspector-scroll">
				<section className="property-section">
					<h2>Canvas</h2>
					<label>
						Background
						<span className="color-field">
							<input
								type="color"
								value={project.background}
								onChange={(event) => onProject({ background: event.target.value })}
							/>
							<code>{project.background}</code>
						</span>
					</label>
					<div className="dimension-readout">
						{project.width} × {project.height} · {project.fps} fps
					</div>
				</section>
				{clip ? (
					<section className="property-section">
						<div className="section-title">
							<h2>Layer</h2>
							<button
								className="icon-button danger"
								onClick={onRemove}
								aria-label="Delete selected layer"
								title="Delete layer"
							>
								<Trash2 size={15} />
							</button>
						</div>
						<label>
							Name
							<input value={clip.name} onChange={(event) => onClip({ name: event.target.value })} />
						</label>
						<div className="field-row">
							<label>
								Start
								<input
									type="number"
									min="0"
									step="0.1"
									value={clip.start}
									onChange={(event) => onClip({ start: Math.max(0, Number(event.target.value)) })}
								/>
							</label>
							<label>
								Duration
								<input
									type="number"
									min="0.5"
									step="0.1"
									value={clip.duration}
									onChange={(event) =>
										onClip({ duration: Math.max(0.5, Number(event.target.value)) })
									}
								/>
							</label>
						</div>
						{clip.kind === 'text' ? (
							<>
								<label>
									Text
									<textarea
										rows={4}
										value={clip.text}
										onChange={(event) => onClip({ text: event.target.value })}
									/>
								</label>
								<div className="field-row">
									<label>
										Size
										<input
											type="number"
											min="16"
											max="240"
											value={clip.fontSize}
											onChange={(event) => onClip({ fontSize: Number(event.target.value) })}
										/>
									</label>
									<label>
										Color
										<input
											type="color"
											value={clip.color}
											onChange={(event) => onClip({ color: event.target.value })}
										/>
									</label>
								</div>
							</>
						) : null}
						{clip.kind === 'video' || clip.kind === 'image' ? (
							<label>
								Fit
								<select
									value={clip.fit}
									onChange={(event) => onClip({ fit: event.target.value as Clip['fit'] })}
								>
									<option value="cover">Fill canvas</option>
									<option value="contain">Fit inside</option>
								</select>
							</label>
						) : null}
						{clip.kind === 'video' || clip.kind === 'audio' ? (
							<>
								<label>
									Volume <span>{Math.round(clip.volume * 100)}%</span>
									<input
										type="range"
										min="0"
										max="1"
										step="0.05"
										value={clip.volume}
										onChange={(event) => onClip({ volume: Number(event.target.value) })}
									/>
								</label>
								<label className="checkbox-field">
									<input
										type="checkbox"
										checked={clip.muted}
										onChange={(event) => onClip({ muted: event.target.checked })}
									/>
									Mute layer
								</label>
							</>
						) : null}
					</section>
				) : (
					<p className="empty-copy inspector-empty">Select a layer in the timeline to edit it.</p>
				)}
			</div>
		</aside>
	);
}
