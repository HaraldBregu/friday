import React from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { LogoView } from '@/components/app/base/logo-view';
import { Button } from '@/components/ui/button';

type LandingStepProps = {
	readonly loading: boolean;
	readonly onStart: () => void;
};

export function LandingStep({ loading, onStart }: LandingStepProps): React.JSX.Element {
	return (
		<div className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center px-4 pt-8 pb-24 text-center sm:px-6">
			<div className="flex size-24 items-center justify-center rounded-2xl bg-background shadow-sm">
				<LogoView className="size-20 rounded-xl" />
			</div>
			<h1 className="mt-6 text-2xl font-bold leading-tight tracking-tight text-foreground">
				Kucedr
			</h1>
			<p className="mt-3 max-w-md text-lg leading-relaxed text-muted-foreground">
				Personal multi-task desktop ai assistant
			</p>
			<p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
				Kucedr helps with everyday tasks, works across your tools, and keeps important context close
				at hand.
			</p>
			<Button className="mt-8" size="sm" disabled={loading} onClick={onStart}>
				{loading ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : null}
				{loading ? 'Checking your session…' : 'Get started'}
				{loading ? null : <ArrowRight className="size-3.5" aria-hidden="true" />}
			</Button>
		</div>
	);
}
