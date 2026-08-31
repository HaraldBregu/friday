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
		<div className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center px-4 py-8 text-center sm:px-6">
			<div className="flex size-24 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-sm">
				<LogoView className="size-20 rounded-xl" />
			</div>
			<p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
				Welcome to Friday
			</p>
			<h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-foreground">
				Your desktop AI copilot
			</h1>
			<p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
				Friday helps with everyday tasks, works across your tools, and keeps important context
				close at hand.
			</p>
			<Button className="mt-8" size="sm" disabled={loading} onClick={onStart}>
				{loading ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : null}
				{loading ? 'Checking your session…' : 'Get started'}
				{loading ? null : <ArrowRight className="size-3.5" aria-hidden="true" />}
			</Button>
			<p className="mt-2 text-xs text-muted-foreground">
				Continue to sign in or finish setting up your workspace.
			</p>
		</div>
	);
}
