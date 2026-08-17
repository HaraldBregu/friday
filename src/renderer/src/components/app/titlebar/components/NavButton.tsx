import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavButtonProps {
	onClick: () => void;
	title: string;
	disabled?: boolean;
	ghost?: boolean;
	className?: string;
	children: ReactNode;
}

export function NavButton({ onClick, title, disabled = false, ghost = false, className, children }: NavButtonProps) {
	return (
		<button
			type="button"
				onClick={onClick}
				disabled={disabled}
				title={title}
				aria-label={title}
			className={cn(
				'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100',
				ghost ? 'hover:text-foreground' : 'hover:bg-accent/80 hover:text-foreground',
				disabled && 'cursor-not-allowed opacity-40 hover:text-muted-foreground',
				className
			)}
		>
			{children}
		</button>
	);
}
