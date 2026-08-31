import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { LogoView } from '@/components/app/base/logo-view';

const StartPage: React.FC = () => (
	<main className="app-translucent-window flex h-screen w-full items-center justify-center bg-background text-foreground">
		<div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
			<LogoView className="size-16 rounded-xl" />
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
				Starting Friday…
			</div>
		</div>
	</main>
);

export default StartPage;
