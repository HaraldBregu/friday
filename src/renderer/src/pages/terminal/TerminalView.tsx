import type { ReactElement } from 'react';
import { useTerminal } from './useTerminal';
import './terminal.css';

export function TerminalView(): ReactElement {
	const { containerRef, status } = useTerminal();

	return (
		<section className="terminal-shell" aria-label="Terminal">
			<div ref={containerRef} className="terminal-viewport" />
			{status.phase === 'starting' ? (
				<div className="terminal-status" role="status">
					Starting shell…
				</div>
			) : null}
			{status.phase === 'error' ? (
				<div className="terminal-error" role="alert">
					{status.message}
				</div>
			) : null}
		</section>
	);
}
