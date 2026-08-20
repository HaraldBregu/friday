import { Bot, Plus, TerminalSquare } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CoderController } from '@/controller';

export function Header({ coder }: { coder: CoderController }) {
	const session = coder.sessions.find((item) => item.id === coder.activeSessionId);
	return (
		<header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-3">
			<SidebarTrigger />

			<div className="flex min-w-0 flex-1 items-center gap-2">
				{coder.mode === 'agent' ? (
					<Bot className="size-4 shrink-0 text-muted-foreground" />
				) : (
					<TerminalSquare className="size-4 shrink-0 text-muted-foreground" />
				)}
				<div className="min-w-0">
					<div className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
						<span className="truncate">{coder.activeProject?.name ?? 'Coder'}</span>
						<span className="text-muted-foreground">/</span>
						<span className="truncate text-muted-foreground">
							{session?.title ?? 'New session'}
						</span>
					</div>
					<p className="truncate font-mono text-[10px] text-muted-foreground">
						{coder.activeProject?.directory ?? 'Open a project to begin'}
					</p>
				</div>
			</div>

			<Badge
				variant={
					coder.runState === 'error'
						? 'destructive'
						: coder.runState === 'running'
							? 'secondary'
							: 'outline'
				}
				className="hidden sm:inline-flex"
			>
				<span
					className={`size-1.5 rounded-full ${coder.runState === 'running' ? 'animate-pulse bg-command' : coder.runState === 'error' ? 'bg-destructive' : 'bg-foreground/50'}`}
				/>
				{coder.runLabel}
			</Badge>

			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							variant="outline"
							size="icon-sm"
							aria-label="New coding session"
							disabled={!coder.activeProject || coder.runState === 'running'}
							onClick={() => coder.newSession()}
						>
							<Plus />
						</Button>
					}
				/>
				<TooltipContent>New session · ⌘/Ctrl N</TooltipContent>
			</Tooltip>
		</header>
	);
}
