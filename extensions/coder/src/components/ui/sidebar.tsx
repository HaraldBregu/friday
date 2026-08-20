import { createContext, useContext, useEffect, type ComponentProps, type ReactNode } from 'react';
import { PanelLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarContextValue {
	open: boolean;
	toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
	open,
	onOpenChange,
	children,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: ReactNode;
}) {
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent): void => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
				event.preventDefault();
				onOpenChange(!open);
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [onOpenChange, open]);

	return (
		<SidebarContext.Provider value={{ open, toggle: () => onOpenChange(!open) }}>
			<div className="group/sidebar flex h-full min-h-0 w-full" data-state={open ? 'expanded' : 'collapsed'}>
				{children}
			</div>
		</SidebarContext.Provider>
	);
}

export function Sidebar({ className, ...props }: ComponentProps<'aside'>) {
	const context = useContext(SidebarContext);
	if (!context) throw new Error('Sidebar must be rendered inside SidebarProvider.');
	return (
		<aside
			id="coder-sidebar"
			data-state={context.open ? 'expanded' : 'collapsed'}
			className={cn(
				'flex w-72 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 data-[state=collapsed]:w-12',
				className
			)}
			{...props}
		/>
	);
}

export function SidebarHeader({ className, ...props }: ComponentProps<'div'>) {
	return <div className={cn('shrink-0', className)} {...props} />;
}

export function SidebarContent({ className, ...props }: ComponentProps<'div'>) {
	return <div className={cn('min-h-0 flex-1 overflow-y-auto overflow-x-hidden', className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: ComponentProps<'div'>) {
	return <div className={cn('shrink-0', className)} {...props} />;
}

export function SidebarInset({ className, ...props }: ComponentProps<'section'>) {
	return <section className={cn('flex min-w-0 flex-1 flex-col', className)} {...props} />;
}

export function SidebarTrigger({ className }: { className?: string }) {
	const context = useContext(SidebarContext);
	if (!context) throw new Error('SidebarTrigger must be rendered inside SidebarProvider.');
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						className={className}
						aria-controls="coder-sidebar"
						aria-expanded={context.open}
						aria-label="Toggle project navigation"
						onClick={context.toggle}
					>
						<PanelLeft />
					</Button>
				}
			/>
			<TooltipContent>Toggle sidebar · ⌘/Ctrl B</TooltipContent>
		</Tooltip>
	);
}
