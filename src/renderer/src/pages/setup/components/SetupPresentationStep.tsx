import React from 'react';
import { KeyRound, MessageSquareText, SlidersHorizontal } from 'lucide-react';
import { LogoView } from '@/components/app/base/logo-view';
import { STEP_COPY } from '../constants';

export function PresentationStep(): React.JSX.Element {
	const { title, description } = STEP_COPY.presentation;

	return (
		<div className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center px-4 py-8 text-center sm:px-6">
			<div className="flex size-24 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-sm">
				<LogoView className="size-20 rounded-xl" />
			</div>
			<p className="mt-6 text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
				Welcome to Friday
			</p>
			<h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-foreground">
				{title}
			</h1>
			<p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>

			<div className="mt-8 w-full pt-5">
				<ol
					className="flex items-center justify-center gap-4 sm:gap-8"
					aria-label="Setup overview"
				>
					<li className="flex items-center gap-1.5 text-xs font-medium text-foreground">
						<KeyRound className="size-4 shrink-0 text-primary" aria-hidden="true" />
						<span>Connect providers</span>
					</li>
					<li className="flex items-center gap-1.5 text-xs font-medium text-foreground">
						<SlidersHorizontal className="size-4 shrink-0 text-primary" aria-hidden="true" />
						<span>Setup settings</span>
					</li>
					<li className="flex items-center gap-1.5 text-xs font-medium text-foreground">
						<MessageSquareText className="size-4 shrink-0 text-primary" aria-hidden="true" />
						<span>Start working</span>
					</li>
				</ol>
			</div>
		</div>
	);
}
