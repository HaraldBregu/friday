import { useEffect, useState } from 'react';

import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Workspace } from '@/components/workspace';
import { useCoderWorkspace } from '@/hooks/workspace';
import { useTheme } from '@/hooks/use-theme';

export default function App() {
	useTheme();
	const coder = useCoderWorkspace();
	const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 759px)').matches);

	useEffect(() => {
		const media = window.matchMedia('(max-width: 759px)');
		const update = () => setMobile(media.matches);
		media.addEventListener('change', update);
		if (media.matches) coder.setLeftOpen(false);
		return () => media.removeEventListener('change', update);
	}, []);

	return (
		<TooltipProvider>
			<main className="flex h-full min-h-0 bg-background text-foreground">
				{!mobile && coder.leftOpen ? (
					<aside className="w-72 shrink-0 border-r" aria-label="Coder projects and sessions">
						<Sidebar coder={coder} />
					</aside>
				) : null}
				{mobile ? (
					<Sheet open={coder.leftOpen} onOpenChange={coder.setLeftOpen}>
						<SheetContent>
							<Sidebar coder={coder} />
						</SheetContent>
					</Sheet>
				) : null}
				<section className="flex min-w-0 flex-1 flex-col">
					<Header coder={coder} />
					<Workspace coder={coder} />
				</section>
			</main>
		</TooltipProvider>
	);
}
