import { Bot, CircleStop, CornerDownLeft, TerminalSquare } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CoderController } from '@/controller';

export function Composer({ coder }: { coder: CoderController }) {
	const disabled = !coder.activeProject?.available || !coder.modelId;
	return (
		<form
			className="shrink-0 border-t bg-background p-3"
			onSubmit={(event) => {
				event.preventDefault();
				void coder.send();
			}}
		>
			<div className="mx-auto max-w-4xl rounded-xl border bg-card shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
				<Textarea
					id="coder-composer"
					value={coder.input}
					onChange={(event) => coder.setInput(event.target.value)}
					onKeyDown={(event) => {
						if (event.ctrlKey && event.key.toLowerCase() === 'c' && coder.runState === 'running') {
							event.preventDefault();
							coder.cancelRun();
							return;
						}
						if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault();
							void coder.send();
						}
					}}
					placeholder={
						disabled
							? 'Open an available project and configure a model…'
							: coder.mode === 'agent'
								? 'Ask Pi to build, debug, or explain…'
								: 'Enter a non-interactive shell command…'
					}
					disabled={disabled}
					aria-label={coder.mode === 'agent' ? 'Agent prompt' : 'Shell command'}
					className="min-h-20 max-h-48 border-0 bg-transparent font-sans shadow-none focus-visible:border-0 focus-visible:ring-0"
			/>
				<div className="flex items-center gap-2 border-t px-2 py-2">
					<div className="flex items-center rounded-md bg-muted p-0.5" aria-label="Input mode">
						<Button
							type="button"
							size="sm"
							variant={coder.mode === 'agent' ? 'secondary' : 'ghost'}
							className="h-7 gap-1.5 px-2"
							onClick={() => coder.setMode('agent')}
						>
							<Bot /> Agent
						</Button>
						<Button
							type="button"
							size="sm"
							variant={coder.mode === 'shell' ? 'secondary' : 'ghost'}
							className="h-7 gap-1.5 px-2"
							onClick={() => coder.setMode('shell')}
						>
							<TerminalSquare /> Shell
						</Button>
					</div>
					<Badge variant="outline" className="hidden font-mono md:inline-flex">
						{coder.activeProject?.name ?? 'no project'}
					</Badge>
					<span className="ml-auto hidden text-[10px] text-muted-foreground sm:inline">
						Enter to run · Shift+Enter for newline
					</span>
					{coder.runState === 'running' ? (
						<Tooltip>
							<TooltipTrigger
								render={
									<Button type="button" size="icon-sm" variant="destructive" onClick={coder.cancelRun}>
										<CircleStop />
										<span className="sr-only">Stop current run</span>
									</Button>
								}
							/>
							<TooltipContent>Stop · Ctrl+C</TooltipContent>
						</Tooltip>
					) : (
						<Button type="submit" size="sm" disabled={disabled || !coder.input.trim()} className="gap-1.5">
							Run <CornerDownLeft />
						</Button>
					)}
				</div>
			</div>
			{coder.mode === 'shell' ? (
				<p className="mx-auto mt-2 max-w-4xl text-[10px] text-muted-foreground">
					Shell mode runs one recorded, non-interactive command in the project directory. It is not a PTY.
				</p>
			) : null}
		</form>
	);
}
