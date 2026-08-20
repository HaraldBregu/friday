import { FolderGit2, FolderPlus, MessageSquare, Plus, Search, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CoderController } from '@/controller';

export function Sidebar({ coder }: { coder: CoderController }) {
	const query = coder.query.trim().toLowerCase();
	const projects = coder.projects.filter((project) =>
		`${project.name} ${project.directory}`.toLowerCase().includes(query)
	);
	const sessions = coder.sessions.filter((session) => session.title.toLowerCase().includes(query));
	const relativeTime = (value: string) => {
		const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
		const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
		if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
		const minutes = Math.round(seconds / 60);
		if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
		const hours = Math.round(minutes / 60);
		if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
		return formatter.format(Math.round(hours / 24), 'day');
	};

	return (
		<div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
			<div className="flex h-12 shrink-0 items-center gap-2 px-3">
				<div className="grid size-7 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
					<FolderGit2 className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold">Coder</p>
					<p className="text-[10px] text-muted-foreground">Pi project workbench</p>
				</div>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Add project folder"
								disabled={coder.busy || coder.runState === 'running'}
								onClick={() => void coder.addProject()}
							>
								<FolderPlus />
							</Button>
						}
					/>
					<TooltipContent>Add project folder</TooltipContent>
				</Tooltip>
			</div>

			<div className="relative px-2 pb-2">
				<Search className="pointer-events-none absolute left-4 top-2 size-3.5 text-muted-foreground" />
				<Input
					value={coder.query}
					onChange={(event) => coder.setQuery(event.target.value)}
					placeholder="Search projects and sessions"
					className="pl-8"
				/>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
				<div className="mb-1 flex h-7 items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
					<span>Projects</span>
					<span>{coder.projects.length}</span>
				</div>
				<div className="space-y-0.5">
					{projects.map((project) => (
						<div key={project.id} className="group flex items-center gap-1">
							<Button
								variant={project.id === coder.activeProjectId ? 'secondary' : 'ghost'}
								className="h-auto min-w-0 flex-1 justify-start gap-2 px-2 py-2 text-left"
								disabled={coder.runState === 'running'}
								onClick={() => void coder.selectProject(project.id)}
							>
								<FolderGit2 className={`size-3.5 ${project.available ? '' : 'text-destructive'}`} />
								<span className="min-w-0 flex-1">
									<span className="block truncate text-xs">{project.name}</span>
									<span className="block truncate font-mono text-[9px] font-normal text-muted-foreground">
										{project.directory}
									</span>
								</span>
								{project.kind === 'external' ? <Badge variant="outline">external</Badge> : null}
							</Button>
							{project.id === coder.activeProjectId ? (
								<Tooltip>
									<TooltipTrigger
										render={
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label={`Remove ${project.name} from Coder`}
												disabled={coder.runState === 'running'}
												onClick={() => void coder.removeProject(project.id)}
											>
												<Trash2 />
											</Button>
										}
									/>
									<TooltipContent>Remove reference; files stay on disk</TooltipContent>
								</Tooltip>
							) : null}
						</div>
					))}
				</div>

				<Separator className="my-3" />
				<div className="mb-1 flex h-7 items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
					<span>Sessions</span>
					<Button
						variant="ghost"
						size="icon-sm"
						className="size-6"
						aria-label="New session"
						disabled={!coder.activeProject || coder.runState === 'running'}
						onClick={coder.newSession}
					>
						<Plus />
					</Button>
				</div>
				<div className="space-y-0.5">
					{sessions.length === 0 ? (
						<p className="px-2 py-3 text-xs text-muted-foreground">
							{coder.activeProject ? 'No saved sessions yet.' : 'Select a project.'}
						</p>
					) : (
						sessions.map((session) => (
							<Button
								key={session.id}
								variant={session.id === coder.activeSessionId ? 'secondary' : 'ghost'}
								className="h-auto w-full justify-start gap-2 px-2 py-2 text-left"
								disabled={coder.runState === 'running'}
								onClick={() => void coder.selectSession(session.id)}
							>
								<MessageSquare className="size-3.5" />
								<span className="min-w-0 flex-1">
									<span className="block truncate text-xs">{session.title}</span>
									<span className="block text-[9px] font-normal text-muted-foreground">
										{relativeTime(session.updatedAt)} · {session.messageCount} messages
									</span>
								</span>
							</Button>
						))
					)}
				</div>
			</div>

			<footer className="shrink-0 border-t p-3">
				<div className="flex flex-wrap gap-1.5">
					<Badge variant="secondary">Pi</Badge>
					<Badge variant="outline">{coder.providerId}</Badge>
					<Badge variant="outline" className="max-w-full truncate">
						{coder.modelId || 'model required'}
					</Badge>
					<Badge variant={coder.toolMode === 'coding' ? 'destructive' : 'outline'}>
						{coder.toolMode}
					</Badge>
				</div>
				<p className="mt-2 text-[9px] leading-4 text-muted-foreground">
					A project sets the default cwd, not a filesystem sandbox. Pi tools run with your desktop
					account.
				</p>
			</footer>
		</div>
	);
}
