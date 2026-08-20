import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { Console } from '@/components/console';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { useCoderWorkspace } from '@/hooks/workspace';
import { useTheme } from '@/hooks/use-theme';

export default function App() {
	useTheme();
	const coder = useCoderWorkspace();

	return (
		<main
			className="coder-shell"
			data-left-open={coder.leftOpen}
			style={{ gridTemplateColumns: `${coder.leftOpen ? '248px' : '0px'} minmax(320px, 1fr)` }}
		>
			<aside className="coder-left" aria-label="Coder configuration">
				<Sidebar coder={coder} />
			</aside>

			<section className="coder-main">
				<header className="terminal-titlebar">
					<div className="terminal-titlebar-left">
						<Button
							variant="ghost"
							size="icon"
							aria-label={coder.leftOpen ? 'Hide left sidebar' : 'Show left sidebar'}
							onClick={() => coder.setLeftOpen(!coder.leftOpen)}
						>
							{coder.leftOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
						</Button>
						<span className="terminal-window-dots" aria-hidden="true">
							<i />
							<i />
							<i />
						</span>
					</div>
					<strong>{coder.workspaceName} — Pi Coder</strong>
					<span className={`coder-run-state coder-run-state--${coder.runState}`}>
						<i aria-hidden="true" /> {coder.runLabel}
					</span>
				</header>
				<Console coder={coder} />
			</section>
		</main>
	);
}
