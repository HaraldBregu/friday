import React from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { LogoView } from '@/components/app/base/logo-view';
import { Button } from '@/components/ui/button';
import './landing.css';

type LandingStepProps = {
	readonly loading: boolean;
	readonly onStart: () => void;
};

export function LandingStep({ loading, onStart }: LandingStepProps): React.JSX.Element {
	return (
		<div className="landing mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center px-4 pt-10 pb-20 text-center sm:px-6">
			<div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
				<LogoView className="size-14" />
			</div>
			<h1 className="mt-6 font-heading text-5xl font-black leading-none tracking-[-0.055em] text-primary">
				Kucedr
			</h1>
			<p className="mt-5 max-w-xs text-balance text-xl font-medium leading-snug tracking-tight text-foreground">
				Personal multi-task desktop AI assistant
			</p>
			<p className="mt-4 max-w-sm text-pretty text-sm leading-7 text-muted-foreground">
				Kucedr helps with everyday tasks, works across your tools, and keeps important context close
				at hand.
			</p>
			<Button
				className="mt-8 h-10 min-w-56 gap-2 px-5 hover:bg-primary/90"
				size="lg"
				disabled={loading}
				aria-busy={loading}
				onClick={onStart}
			>
				{loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
				{loading ? 'Checking your session…' : 'Get started'}
				{loading ? null : <ArrowRight className="size-4" aria-hidden="true" />}
			</Button>
		</div>
	);
}
