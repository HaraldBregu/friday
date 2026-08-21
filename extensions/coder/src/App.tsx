import { Header } from '@/components/header';
import { ProjectSidebar } from '@/components/sidebar';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Workspace } from '@/components/workspace';
import { useCoderWorkspace } from '@/hooks/workspace';
import { useTheme } from '@/hooks/use-theme';

export default function App() {
	useTheme();
	const coder = useCoderWorkspace();
	const [page, setPage] = useState<'workspace' | 'configuration'>('workspace');

	return (
		<TooltipProvider>
			<SidebarProvider open={coder.leftOpen} onOpenChange={coder.setLeftOpen}>
				<main className="flex h-full min-h-0 w-full bg-background text-foreground">
					<Sidebar aria-label="Coder workspaces and sessions">
						<ProjectSidebar
							coder={coder}
							configurationOpen={page === 'configuration'}
							onOpenConfiguration={() => setPage('configuration')}
							onOpenWorkspace={() => setPage('workspace')}
						/>
					</Sidebar>
					<SidebarInset>
						{page === 'configuration' ? (
							<Configuration
								onDone={() => {
									void coder.refresh();
									setPage('workspace');
								}}
							/>
						) : (
							<>
								<Header coder={coder} />
								<Workspace coder={coder} />
							</>
						)}
					</SidebarInset>
				</main>
			</SidebarProvider>
		</TooltipProvider>
	);
}
import { useState } from 'react';

import { Configuration } from '@/components/configuration';
