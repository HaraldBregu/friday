import React from 'react';

type StepHeaderProps = {
	readonly title: string;
	readonly description: string;
};

export function StepHeader({ title, description }: StepHeaderProps): React.JSX.Element {
	return (
		<div>
			<h1 className="text-2xl font-bold leading-tight tracking-normal text-foreground">{title}</h1>
			<p className="mt-2 max-w-md text-xs font-medium leading-relaxed text-muted-foreground">
				{description}
			</p>
		</div>
	);
}
