import { useState } from 'react';

import { Configuration } from '@/components/configuration';
import { Header } from '@/components/header';
import { Instructions } from '@/components/instructions';
import { ProjectSidebar } from '@/components/sidebar';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Workspace } from '@/components/workspace';
import { useCoderWorkspace } from '@/hooks/workspace';
import { useTheme } from '@/hooks/use-theme';
import { canLeaveInstructions } from '@/navigation';
import { TerminalView } from '@/terminal/view';

type CoderPage = 'workspace' | 'terminal' | 'configuration' | 'instructions';

export default function App() {
	useTheme();
	const coder = useCoderWorkspace();
	const [page, setPage] = useState<CoderPage>('workspace');
	const [instructionsDirty, setInstructionsDirty] = useState(false);
	const openPage = (nextPage: CoderPage): boolean => {
		if (nextPage !== 'instructions' && !canLeaveInstructions(page, instructionsDirty)) {
			return false;
		}
		setPage(nextPage);
		if (nextPage !== 'instructions') setInstructionsDirty(false);
		return true;
	};

	return (
		<TooltipProvider>
			<SidebarProvider open={coder.leftOpen} onOpenChange={coder.setLeftOpen}>
				<main className="flex h-full min-h-0 w-full bg-background text-foreground">
					<Sidebar aria-label="Coder workspaces and sessions">
						<ProjectSidebar
							coder={coder}
							configurationOpen={page === 'configuration'}
							onOpenConfiguration={() => void openPage('configuration')}
							onOpenWorkspace={() => openPage('workspace')}
						/>
					</Sidebar>
					<SidebarInset>
						{page === 'configuration' ? (
							<Configuration
								onDone={() => {
									void coder.refresh();
									openPage('workspace');
								}}
							/>
						) : page === 'instructions' && coder.activeProject ? (
							<Instructions
								projectId={coder.activeProject.id}
								projectName={coder.activeProject.name}
								onDirtyChange={setInstructionsDirty}
								onDone={() => void openPage('workspace')}
							/>
						) : (
							<>
								<Header
									coder={coder}
									terminalOpen={page === 'terminal'}
									onOpenInstructions={() => void openPage('instructions')}
									onToggleTerminal={() =>
										void openPage(page === 'terminal' ? 'workspace' : 'terminal')
									}
								/>
								{page === 'terminal' ? (
									<TerminalView
										cwd={
											coder.activeProject?.available
												? coder.activeProject.directory
												: undefined
										}
									/>
								) : (
									<Workspace coder={coder} />
								)}
							</>
						)}
					</SidebarInset>
				</main>
			</SidebarProvider>
		</TooltipProvider>
	);
}
