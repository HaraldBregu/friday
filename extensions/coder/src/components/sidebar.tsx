import {
	ChevronRight,
	Copy,
	FolderGit2,
	FolderOpen,
	FolderPlus,
	MessageSquare,
	Plus,
	RefreshCw,
	Search,
	Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CoderController } from '@/controller';
import { relativeTime } from '@/lib/relative';

export function ProjectSidebar({ coder }: { coder: CoderController }) {
	const query = coder.query.trim().toLowerCase();
	const visibleProjects = coder.projects.filter((project) => {
		const projectMatches = `${project.name} ${project.directory}`.toLowerCase().includes(query);
		const sessionMatches = (coder.sessionsByProject[project.id] ?? []).some((session) =>
			session.title.toLowerCase().includes(query)
		);
		return !query || projectMatches || sessionMatches;
	});

	return (
		<>
			<SidebarHeader className="border-b border-sidebar-border">
				<div className="flex h-12 items-center gap-2 px-2">
					<div className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
						<FolderGit2 className="size-4" />
					</div>
					<div className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
						<p className="text-xs font-semibold">Coder</p>
						<p className="text-[10px] text-muted-foreground">Pi workbench</p>
					</div>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label="Add workspace folder"
									disabled={coder.busy || coder.runState === 'running'}
									onClick={() => void coder.addProject()}
								>
									<FolderPlus />
								</Button>
							}
						/>
						<TooltipContent>Add workspace folder</TooltipContent>
					</Tooltip>
				</div>
				<div className="relative px-2 pb-2 group-data-[state=collapsed]/sidebar:hidden">
					<Search className="pointer-events-none absolute left-4 top-2 size-3.5 text-muted-foreground" />
					<Input
						aria-label="Search workspaces and sessions"
						value={coder.query}
						onChange={(event) => coder.setQuery(event.target.value)}
						placeholder="Search workspaces and sessions"
						className="pl-8"
					/>
				</div>
			</SidebarHeader>

			<SidebarContent aria-busy={coder.busy}>
				<nav aria-label="Coder workspaces and sessions" className="p-2">
					<div className="mb-1 flex h-7 items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-data-[state=collapsed]/sidebar:hidden">
						<span>Workspaces</span>
						<span>{coder.projects.length}</span>
					</div>
					<ul className="space-y-1">
						{visibleProjects.map((project) => {
							const sessions = coder.sessionsByProject[project.id] ?? [];
							const filteredSessions = query
								? sessions.filter((session) => session.title.toLowerCase().includes(query))
								: sessions;
							const expanded = Boolean(query) || coder.expandedProjectIds.includes(project.id);
							return (
								<li key={project.id}>
									<Collapsible open={expanded} onOpenChange={() => coder.toggleProject(project.id)}>
										<div className="flex items-center gap-0.5">
											<CollapsibleTrigger
												className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[state=collapsed]/sidebar:hidden"
												aria-label={`${expanded ? 'Collapse' : 'Expand'} ${project.name}`}
											>
												<ChevronRight className={`size-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
											</CollapsibleTrigger>
											<Tooltip>
												<TooltipTrigger
													render={
														<Button
															variant={project.id === coder.activeProjectId ? 'secondary' : 'ghost'}
															className="h-auto min-w-0 flex-1 justify-start gap-2 px-2 py-2 text-left group-data-[state=collapsed]/sidebar:size-8 group-data-[state=collapsed]/sidebar:p-0"
															aria-current={project.id === coder.activeProjectId ? 'location' : undefined}
															disabled={coder.runState === 'running'}
															onClick={() => void coder.selectProject(project.id)}
														>
															<FolderGit2 className={`size-3.5 ${project.available ? '' : 'text-destructive'}`} />
															<span className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
																<span className="block truncate text-xs">{project.name}</span>
																<span className="block truncate font-mono text-[9px] font-normal text-muted-foreground">
																	{project.available ? project.directory : 'Unavailable'}
																</span>
															</span>
														</Button>
													}
												/>
												<TooltipContent>{project.directory}</TooltipContent>
											</Tooltip>
										</div>
										<CollapsibleContent className="group-data-[state=collapsed]/sidebar:hidden">
											<ul className="ml-5 border-l border-sidebar-border pl-2">
												<li>
													<Button variant="ghost" className="h-7 w-full justify-start gap-2 px-2 text-[11px] text-muted-foreground" disabled={coder.runState === 'running'} onClick={() => coder.newSession(project.id)}>
														<Plus className="size-3" /> New session
													</Button>
												</li>
												{filteredSessions.map((session) => (
													<li key={session.id}>
														<Button
															variant={session.id === coder.activeSessionId ? 'secondary' : 'ghost'}
															className="h-auto w-full justify-start gap-2 px-2 py-1.5 text-left"
															aria-current={session.id === coder.activeSessionId ? 'page' : undefined}
															disabled={coder.runState === 'running'}
															onClick={() => void coder.selectSession(project.id, session.id)}
														>
															<MessageSquare className="size-3.5" />
															<span className="min-w-0 flex-1">
																<span className="block truncate text-[11px]">{session.title}</span>
																<time dateTime={session.updatedAt} title={new Date(session.updatedAt).toLocaleString()} className="block text-[9px] font-normal text-muted-foreground">
																	{relativeTime(session.updatedAt)} · {session.messageCount}
																</time>
															</span>
														</Button>
													</li>
												))}
											</ul>
										</CollapsibleContent>
									</Collapsible>
								</li>
							);
						})}
					</ul>
				</nav>
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border p-2">
				{coder.activeProject ? (
					<div className="mb-2 grid grid-cols-4 gap-1 group-data-[state=collapsed]/sidebar:grid-cols-1">
						<Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Open workspace folder" onClick={() => void coder.openProject(coder.activeProject!.id)}><FolderOpen /></Button>} /><TooltipContent>Open workspace folder</TooltipContent></Tooltip>
						<Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Copy workspace path" onClick={() => void navigator.clipboard.writeText(coder.activeProject!.directory)}><Copy /></Button>} /><TooltipContent>Copy workspace path</TooltipContent></Tooltip>
						<Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Refresh workspaces and sessions" disabled={coder.busy} onClick={() => void coder.refresh()}><RefreshCw /></Button>} /><TooltipContent>Refresh</TooltipContent></Tooltip>
						<Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Remove workspace from Coder" disabled={coder.runState === 'running'} onClick={() => void coder.removeProject(coder.activeProject!.id)}><Trash2 /></Button>} /><TooltipContent>Remove reference; files stay on disk</TooltipContent></Tooltip>
					</div>
				) : null}
				<Separator className="mb-2 group-data-[state=collapsed]/sidebar:hidden" />
				<div className="flex flex-wrap gap-1.5 group-data-[state=collapsed]/sidebar:hidden">
					<Badge variant="secondary">Pi</Badge>
					<Badge variant="outline">{coder.providerId}</Badge>
					<Badge variant="outline" className="max-w-full truncate">{coder.modelId || 'model required'}</Badge>
					<Badge variant={coder.toolMode === 'coding' ? 'destructive' : 'outline'}>{coder.toolMode}</Badge>
				</div>
			</SidebarFooter>
		</>
	);
}
