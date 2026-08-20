import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
	'inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-full border px-2 text-[11px] font-medium',
	{
		variants: {
			variant: {
				default: 'border-transparent bg-primary text-primary-foreground',
				secondary: 'border-transparent bg-secondary text-secondary-foreground',
				outline: 'border-border text-muted-foreground',
				destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
			},
		},
		defaultVariants: { variant: 'default' },
	}
);

export function Badge({
	className,
	variant,
	...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
	return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
