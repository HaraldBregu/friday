import { useEffect, useRef, useState } from 'react';
import { ArrowDown, FolderOpen, MessageSquarePlus, TriangleAlert } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Empty } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Blocks } from '@/components/blocks';
import { Composer } from '@/components/composer';
import type { CoderController } from '@/controller';

export function Workspace({ coder }: { coder: CoderController }) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [atBottom, setAtBottom] = useState(true);

	useEffect(() => {
		const scroll = scrollRef.current;
		if (scroll && atBottom) scroll.scrollTop = scroll.scrollHeight;
	}, [atBottom, coder.blocks, coder.runLabel]);

	const scrollToLatest = () => {
		const scroll = scrollRef.current;
		if (!scroll) return;
		scroll.scrollTo({ top: scroll.scrollHeight, behavior: 'smooth' });
		setAtBottom(true);
	};

	return (
		<div className="relative flex min-h-0 flex-1 flex-col bg-background">
			<div
				ref={scrollRef}
				className="min-h-0 flex-1 overflow-y-auto"
				onScroll={(event) => {
					const target = event.currentTarget;
					setAtBottom(target.scrollHeight - target.scrollTop - target.clientHeight < 72);
				}}
			>
				{coder.loading ? (
					<div className="space-y-4 p-6">
						<Skeleton className="h-20 w-3/4" />
						<Skeleton className="h-28 w-full" />
						<Skeleton className="h-16 w-2/3" />
					</div>
				) : !coder.activeProject ? (
					<Empty>
						<div className="grid size-10 place-items-center rounded-lg bg-muted">
							<FolderOpen className="size-5" />
						</div>
						<div>
							<h1 className="text-sm font-medium">Open a project</h1>
							<p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
								Choose Friday’s workspace or any folder you want Pi to use as its working directory.
							</p>
						</div>
						<Button onClick={() => void coder.addProject()} disabled={coder.busy}>
							<FolderOpen /> Choose folder
						</Button>
					</Empty>
				) : !coder.activeProject.available ? (
					<Empty>
						<TriangleAlert className="size-7 text-destructive" />
						<div>
							<h1 className="text-sm font-medium">Project folder unavailable</h1>
							<p className="mt-1 max-w-md break-all text-xs text-muted-foreground">
								{coder.activeProject.directory}
							</p>
						</div>
						<Button
							variant="outline"
							onClick={() => void coder.removeProject(coder.activeProject!.id)}
						>
							Remove from Coder
						</Button>
					</Empty>
				) : coder.blocks.length === 0 ? (
					<Empty>
						<div className="grid size-10 place-items-center rounded-lg bg-muted">
							<MessageSquarePlus className="size-5" />
						</div>
						<div>
							<h1 className="text-sm font-medium">Start a coding session</h1>
							<p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
								Ask Pi to inspect the project, implement a change, debug a failure, or switch to
								Shell for a direct command.
							</p>
						</div>
					</Empty>
				) : (
					<Blocks coder={coder} />
				)}

				{coder.error ? (
					<div className="p-4 sm:px-6">
						<Alert className="border-destructive/30 bg-destructive/5 text-destructive">
							{coder.error}
						</Alert>
					</div>
				) : null}
			</div>

			{!atBottom && coder.blocks.length > 0 ? (
				<Button
					variant="secondary"
					size="sm"
					className="absolute bottom-32 left-1/2 z-10 -translate-x-1/2 gap-1.5 shadow-md"
					onClick={scrollToLatest}
				>
					<ArrowDown /> Jump to latest
				</Button>
			) : null}

			<div className="sr-only" aria-live="polite">
				{coder.runLabel}
			</div>
			<Composer coder={coder} />
		</div>
	);
}
