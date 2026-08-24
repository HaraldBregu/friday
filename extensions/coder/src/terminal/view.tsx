import { LoaderCircle, TriangleAlert } from 'lucide-react';

import { useTerminalSession } from '@/terminal/session';

export function TerminalView({ cwd }: { cwd?: string }) {
	const { containerRef, status } = useTerminalSession(cwd);

	return (
		<section className="coder-terminal" aria-label="Interactive terminal">
			<div ref={containerRef} className="coder-terminal-host" />
			{status.state === 'starting' ? (
				<div className="coder-terminal-status" role="status">
					<LoaderCircle className="size-3 animate-spin" /> {status.message}
				</div>
			) : status.state === 'error' ? (
				<div className="coder-terminal-status text-red-300" role="alert">
					<TriangleAlert className="size-3" /> {status.message}
				</div>
			) : status.state === 'exited' ? (
				<div className="coder-terminal-status" role="status">
					{status.message}
				</div>
			) : null}
		</section>
	);
}
