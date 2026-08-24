import type { ReactElement } from 'react';
import { TerminalView } from './TerminalView';

export default function TerminalPage(): ReactElement {
	return (
		<main className="h-full min-h-0 overflow-hidden bg-[#0d1117]">
			<TerminalView />
		</main>
	);
}
