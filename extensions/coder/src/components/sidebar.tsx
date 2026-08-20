import { Braces, Code2, FolderGit2, PanelLeftClose, RotateCcw, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { CoderController } from '@/controller';

export function Sidebar({ coder }: { coder: CoderController }) {
	return (
		<div className="coder-sidebar-inner">
			<div className="coder-brand">
				<div className="coder-brand-mark">
					<Code2 />
				</div>
				<div className="coder-brand-copy">
					<strong>Coder</strong>
					<span>Pi coding agent</span>
				</div>
				<Button
					className="coder-sidebar-close"
					variant="ghost"
					size="icon"
					aria-label="Hide left sidebar"
					onClick={() => coder.setLeftOpen(false)}
				>
					<PanelLeftClose />
				</Button>
			</div>
			<Button
				className="coder-new-task"
				onClick={coder.clearTerminal}
				disabled={coder.runState === 'running'}
			>
				<RotateCcw /> Clear terminal <kbd>⌘N</kbd>
			</Button>

			<section className="coder-sidebar-section coder-runtime">
				<header>
					<span>Runtime</span>
					<span>Pi</span>
				</header>
				<dl className="coder-runtime-list">
					<div>
						<dt>
							<Braces /> Provider
						</dt>
						<dd>{coder.providerId}</dd>
					</div>
					<div>
						<dt>
							<Code2 /> Model
						</dt>
						<dd>{coder.modelId || 'Not selected'}</dd>
					</div>
					<div>
						<dt>
							<ShieldCheck /> Tools
						</dt>
						<dd>{coder.toolMode}</dd>
					</div>
				</dl>
			</section>

			<section className="coder-sidebar-section coder-projects">
				<header>
					<span>Workspace</span>
					<span>1</span>
				</header>
				<div className="coder-project is-selected">
					<span className="coder-project-icon">
						<FolderGit2 />
					</span>
					<span>
						<strong>{coder.workspaceName}</strong>
						<small>{coder.workingDirectory || 'Not configured'}</small>
					</span>
				</div>
			</section>

			<footer className="coder-workspace-path" title={coder.workingDirectory}>
				<span>{coder.thinkingLevel} thinking</span>
				<small>{coder.isPreview ? 'Browser preview' : 'Friday host'}</small>
			</footer>
		</div>
	);
}
