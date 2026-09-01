import { useEffect, useState } from 'react';
import { isFriday, win } from '@friday/sdk';

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

export default function App() {
	useTheme();
	const coder = useCoderWorkspace();
	const [page, setPage] = useState<'workspace' | 'configuration' | 'instructions'>('workspace');
	const [instructionsDirty, setInstructionsDirty] = useState(false);
	const activeSession = coder.sessions.find((item) => item.id === coder.activeSessionId);
	const title =
		page === 'configuration'
			? 'Coder · Configuration'
			: page === 'instructions'
				? `Coder · ${coder.activeProject?.name ?? 'Agent instructions'}`
				: [coder.activeProject?.name, activeSession?.title].filter(Boolean).join(' · ') || 'Coder';

	useEffect(() => {
		if (!isFriday()) return;
		win.setTitlebarOptions({
			title,
			leftButtons: [
				{
					id: 'toggle-sidebar',
					label: coder.leftOpen ? 'Collapse project navigation' : 'Expand project navigation',
					icon: 'panel-left',
					pressed: coder.leftOpen,
				},
			],
			rightButtons: [],
			sidebarWidth: coder.leftOpen ? 288 : 48,
		});
		return () => win.setTitlebarOptions(null);
	}, [coder.leftOpen, title]);

	useEffect(() => {
		if (!isFriday()) return;
		return win.onTitlebarButtonClick((buttonId) => {
			if (buttonId === 'toggle-sidebar') coder.setLeftOpen((open) => !open);
		});
	}, [coder.setLeftOpen]);

	const openPage = (nextPage: 'workspace' | 'configuration' | 'instructions'): boolean => {
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
								<Header coder={coder} onOpenInstructions={() => void openPage('instructions')} />
								<Workspace coder={coder} />
							</>
						)}
					</SidebarInset>
				</main>
			</SidebarProvider>
		</TooltipProvider>
	);
}
