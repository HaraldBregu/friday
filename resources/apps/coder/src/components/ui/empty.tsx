import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Empty({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center',
				className
			)}
			{...props}
		/>
	);
}
