import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			role="alert"
			className={cn('rounded-lg border bg-card px-3 py-2 text-sm text-card-foreground', className)}
			{...props}
		/>
	);
}
