'use client';

import * as React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { PanelLeftIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePageContext } from './hooks/use-page-context';
import { MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH } from './context/state';

const PAGE_SIDEBAR_LAYOUT_WIDTH_MOBILE = '18rem';
const PAGE_SIDEBAR_LAYOUT_WIDTH_ICON = '3rem';

function PageSidebarLayoutContainer({
	className,
	style,
	children,
	...props
}: React.ComponentProps<'div'>) {
	const { sidebarWidth } = usePageContext();

	return (
		<div
			data-slot="sidebar-wrapper"
			style={
				{
					'--sidebar-width': `${sidebarWidth}px`,
					'--sidebar-width-icon': PAGE_SIDEBAR_LAYOUT_WIDTH_ICON,
					...style,
				} as React.CSSProperties
			}
			className={cn(
				'group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar',
				className
			)}
			{...props}
		>
			{children}
		</div>
	);
}

function PageSidebarLayout({
	side = 'left',
	variant = 'sidebar',
	collapsible = 'offcanvas',
	className,
	children,
	dir,
	...props
}: React.ComponentProps<'div'> & {
	side?: 'left' | 'right';
	variant?: 'sidebar' | 'floating' | 'inset';
	collapsible?: 'offcanvas' | 'icon' | 'none';
}) {
	const { state, isMobile, dispatch } = usePageContext();
	const sidebarLayoutState = state.sidebarOpen ? 'expanded' : 'collapsed';

	if (collapsible === 'none') {
		return (
			<div
				data-slot="sidebar"
				className={cn(
					'flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground',
					className
				)}
				{...props}
			>
				{children}
			</div>
		);
	}

	if (isMobile) {
		return (
			<Sheet
				open={state.sidebarOpenMobile}
				onOpenChange={(open) => dispatch({ type: 'SIDEBAR_OPEN_MOBILE_SET', open })}
				{...props}
			>
				<SheetContent
					dir={dir}
					data-sidebar="sidebar"
					data-slot="sidebar"
					data-mobile="true"
					className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
					style={
						{
							'--sidebar-width': PAGE_SIDEBAR_LAYOUT_WIDTH_MOBILE,
						} as React.CSSProperties
					}
					side={side}
				>
					<SheetHeader className="sr-only">
						<SheetTitle>Sidebar</SheetTitle>
						<SheetDescription>Displays the mobile sidebar.</SheetDescription>
					</SheetHeader>
					<div className="flex h-full w-full flex-col">{children}</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<div
			className="group peer hidden text-sidebar-foreground md:block"
			data-state={sidebarLayoutState}
			data-collapsible={sidebarLayoutState === 'collapsed' ? collapsible : ''}
			data-variant={variant}
			data-side={side}
			data-slot="sidebar"
		>
			<div
				data-slot="sidebar-gap"
				className={cn(
					'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
					'group-data-[collapsible=offcanvas]:w-0',
					'group-data-[side=right]:rotate-180',
					variant === 'floating' || variant === 'inset'
						? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
						: 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)'
				)}
			/>
			<div
				data-slot="sidebar-container"
				data-side={side}
				className={cn(
					'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex',
					variant === 'floating' || variant === 'inset'
						? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
						: 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
					className
				)}
				{...props}
			>
				<div
					data-sidebar="sidebar"
					data-slot="sidebar-inner"
					className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
				>
					{children}
				</div>
			</div>
		</div>
	);
}

function PageSidebarLayoutTrigger({
	className,
	onClick,
	...props
}: React.ComponentProps<typeof Button>) {
	const { toggleSidebar } = usePageContext();

	return (
		<Button
			data-sidebar="trigger"
			data-slot="sidebar-trigger"
			variant="ghost"
			size="icon-sm"
			className={cn(className)}
			onClick={(event) => {
				onClick?.(event);
				toggleSidebar();
			}}
			{...props}
		>
			<PanelLeftIcon className="cn-rtl-flip" />
			<span className="sr-only">Toggle Sidebar</span>
		</Button>
	);
}

function PageSidebarLayoutRail({
	className,
	onKeyDown,
	onPointerDown,
	...props
}: React.ComponentProps<'button'>) {
	const { sidebarWidth, setSidebarWidth } = usePageContext();

	return (
		<button
			type="button"
			data-sidebar="rail"
			data-slot="sidebar-rail"
			role="separator"
			aria-label="Resize sidebar"
			aria-orientation="vertical"
			aria-valuemin={MIN_SIDEBAR_WIDTH}
			aria-valuemax={MAX_SIDEBAR_WIDTH}
			aria-valuenow={sidebarWidth}
			tabIndex={0}
			onKeyDown={(event) => {
				onKeyDown?.(event);
				if (event.defaultPrevented) return;
				if (event.key === 'ArrowLeft') {
					event.preventDefault();
					setSidebarWidth(sidebarWidth - 8);
				}
				if (event.key === 'ArrowRight') {
					event.preventDefault();
					setSidebarWidth(sidebarWidth + 8);
				}
				if (event.key === 'Home') {
					event.preventDefault();
					setSidebarWidth(MIN_SIDEBAR_WIDTH);
				}
				if (event.key === 'End') {
					event.preventDefault();
					setSidebarWidth(MAX_SIDEBAR_WIDTH);
				}
			}}
			onPointerDown={(event) => {
				onPointerDown?.(event);
				if (event.defaultPrevented || event.button !== 0) return;
				event.preventDefault();
				const startX = event.clientX;
				const startWidth = sidebarWidth;
				const side = event.currentTarget.closest('[data-side]')?.getAttribute('data-side');
				const direction = side === 'right' ? -1 : 1;
				const previousCursor = document.body.style.cursor;
				const previousUserSelect = document.body.style.userSelect;
				document.body.style.cursor = 'col-resize';
				document.body.style.userSelect = 'none';

				const handlePointerMove = (moveEvent: PointerEvent): void => {
					setSidebarWidth(startWidth + (moveEvent.clientX - startX) * direction);
				};
				const stopResizing = (): void => {
					window.removeEventListener('pointermove', handlePointerMove);
					window.removeEventListener('pointerup', stopResizing);
					window.removeEventListener('pointercancel', stopResizing);
					document.body.style.cursor = previousCursor;
					document.body.style.userSelect = previousUserSelect;
				};

				window.addEventListener('pointermove', handlePointerMove);
				window.addEventListener('pointerup', stopResizing);
				window.addEventListener('pointercancel', stopResizing);
			}}
			title="Resize sidebar"
			className={cn(
				'absolute inset-y-0 z-20 hidden w-3 cursor-col-resize touch-none outline-none after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 hover:after:bg-sidebar-border focus-visible:after:bg-ring md:block',
				'in-data-[side=left]:-right-1.5 in-data-[side=right]:-left-1.5',
				className
			)}
			{...props}
		/>
	);
}

function PageSidebarLayoutInset({ className, ...props }: React.ComponentProps<'main'>) {
	return (
		<main
			data-slot="sidebar-inset"
			className={cn(
				'relative flex w-full flex-1 flex-col bg-transparent md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
				className
			)}
			{...props}
		/>
	);
}

function PageSidebarLayoutInput({ className, ...props }: React.ComponentProps<typeof Input>) {
	return (
		<Input
			data-slot="sidebar-input"
			data-sidebar="input"
			className={cn('h-8 w-full bg-background/70 shadow-none supports-backdrop-filter:backdrop-blur-xl', className)}
			{...props}
		/>
	);
}

function PageSidebarLayoutHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-header"
			data-sidebar="header"
			className={cn('flex flex-col gap-2 p-2', className)}
			{...props}
		/>
	);
}

function PageSidebarLayoutFooter({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-footer"
			data-sidebar="footer"
			className={cn('flex flex-col gap-2 p-2', className)}
			{...props}
		/>
	);
}

function PageSidebarLayoutSeparator({
	className,
	...props
}: React.ComponentProps<typeof Separator>) {
	return (
		<Separator
			data-slot="sidebar-separator"
			data-sidebar="separator"
			className={cn('mx-2 w-auto bg-sidebar-border', className)}
			{...props}
		/>
	);
}

function PageSidebarLayoutContent({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-content"
			data-sidebar="content"
			className={cn(
				'no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
				className
			)}
			{...props}
		/>
	);
}

function PageSidebarLayoutGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-group"
			data-sidebar="group"
			className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
			{...props}
		/>
	);
}

function PageSidebarLayoutGroupLabel({
	className,
	render,
	...props
}: useRender.ComponentProps<'div'> & React.ComponentProps<'div'>) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(
			{
				className: cn(
					'flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
					className
				),
			},
			props
		),
		render,
		state: {
			slot: 'sidebar-group-label',
			sidebar: 'group-label',
		},
	});
}

function PageSidebarLayoutGroupAction({
	className,
	render,
	...props
}: useRender.ComponentProps<'button'> & React.ComponentProps<'button'>) {
	return useRender({
		defaultTagName: 'button',
		props: mergeProps<'button'>(
			{
				className: cn(
					'absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
					className
				),
			},
			props
		),
		render,
		state: {
			slot: 'sidebar-group-action',
			sidebar: 'group-action',
		},
	});
}

function PageSidebarLayoutGroupContent({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-group-content"
			data-sidebar="group-content"
			className={cn('w-full text-sm', className)}
			{...props}
		/>
	);
}

function PageSidebarLayoutMenu({ className, ...props }: React.ComponentProps<'ul'>) {
	return (
		<ul
			data-slot="sidebar-menu"
			data-sidebar="menu"
			className={cn('flex w-full min-w-0 flex-col gap-0', className)}
			{...props}
		/>
	);
}

function PageSidebarLayoutMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
	return (
		<li
			data-slot="sidebar-menu-item"
			data-sidebar="menu-item"
			className={cn('group/menu-item relative', className)}
			{...props}
		/>
	);
}

const pageSidebarLayoutMenuButtonVariants = cva(
	'peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate',
	{
		variants: {
			variant: {
				default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
				outline:
					'bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]',
			},
			size: {
				default: 'h-8 text-sm',
				sm: 'h-7 text-xs',
				lg: 'h-12 text-sm group-data-[collapsible=icon]:p-0!',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

function PageSidebarLayoutMenuButton({
	render,
	isActive = false,
	variant = 'default',
	size = 'default',
	tooltip,
	className,
	...props
}: useRender.ComponentProps<'button'> &
	React.ComponentProps<'button'> & {
		isActive?: boolean;
		tooltip?: string | React.ComponentProps<typeof TooltipContent>;
	} & VariantProps<typeof pageSidebarLayoutMenuButtonVariants>) {
	const { state, isMobile } = usePageContext();
	const sidebarLayoutState = state.sidebarOpen ? 'expanded' : 'collapsed';
	const comp = useRender({
		defaultTagName: 'button',
		props: mergeProps<'button'>(
			{
				className: cn(pageSidebarLayoutMenuButtonVariants({ variant, size }), className),
			},
			props
		),
		render: !tooltip ? render : <TooltipTrigger render={render} />,
		state: {
			slot: 'sidebar-menu-button',
			sidebar: 'menu-button',
			size,
			active: isActive,
		},
	});

	if (!tooltip) {
		return comp;
	}

	if (typeof tooltip === 'string') {
		tooltip = {
			children: tooltip,
		};
	}

	return (
		<Tooltip>
			{comp}
			<TooltipContent
				side="right"
				align="center"
				hidden={sidebarLayoutState !== 'collapsed' || isMobile}
				{...tooltip}
			/>
		</Tooltip>
	);
}

function PageSidebarLayoutMenuAction({
	className,
	render,
	showOnHover = false,
	...props
}: useRender.ComponentProps<'button'> &
	React.ComponentProps<'button'> & {
		showOnHover?: boolean;
	}) {
	return useRender({
		defaultTagName: 'button',
		props: mergeProps<'button'>(
			{
				className: cn(
					'absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
					showOnHover &&
						'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0',
					className
				),
			},
			props
		),
		render,
		state: {
			slot: 'sidebar-menu-action',
			sidebar: 'menu-action',
		},
	});
}

function PageSidebarLayoutMenuBadge({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-menu-badge"
			data-sidebar="menu-badge"
			className={cn(
				'pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 peer-data-active/menu-button:text-sidebar-accent-foreground',
				className
			)}
			{...props}
		/>
	);
}

function PageSidebarLayoutMenuSkeleton({
	className,
	showIcon = false,
	...props
}: React.ComponentProps<'div'> & {
	showIcon?: boolean;
}) {
	const [width] = React.useState(() => {
		return `${Math.floor(Math.random() * 40) + 50}%`;
	});

	return (
		<div
			data-slot="sidebar-menu-skeleton"
			data-sidebar="menu-skeleton"
			className={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
			{...props}
		>
			{showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
			<Skeleton
				className="h-4 max-w-(--skeleton-width) flex-1"
				data-sidebar="menu-skeleton-text"
				style={
					{
						'--skeleton-width': width,
					} as React.CSSProperties
				}
			/>
		</div>
	);
}

function PageSidebarLayoutMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
	return (
		<ul
			data-slot="sidebar-menu-sub"
			data-sidebar="menu-sub"
			className={cn(
				'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden',
				className
			)}
			{...props}
		/>
	);
}

function PageSidebarLayoutMenuSubItem({ className, ...props }: React.ComponentProps<'li'>) {
	return (
		<li
			data-slot="sidebar-menu-sub-item"
			data-sidebar="menu-sub-item"
			className={cn('group/menu-sub-item relative', className)}
			{...props}
		/>
	);
}

function PageSidebarLayoutMenuSubButton({
	render,
	size = 'md',
	isActive = false,
	className,
	...props
}: useRender.ComponentProps<'a'> &
	React.ComponentProps<'a'> & {
		size?: 'sm' | 'md';
		isActive?: boolean;
	}) {
	return useRender({
		defaultTagName: 'a',
		props: mergeProps<'a'>(
			{
				className: cn(
					'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground',
					className
				),
			},
			props
		),
		render,
		state: {
			slot: 'sidebar-menu-sub-button',
			sidebar: 'menu-sub-button',
			size,
			active: isActive,
		},
	});
}

export {
	PageSidebarLayout,
	PageSidebarLayoutContainer,
	PageSidebarLayoutContent,
	PageSidebarLayoutFooter,
	PageSidebarLayoutGroup,
	PageSidebarLayoutGroupAction,
	PageSidebarLayoutGroupContent,
	PageSidebarLayoutGroupLabel,
	PageSidebarLayoutHeader,
	PageSidebarLayoutInput,
	PageSidebarLayoutInset,
	PageSidebarLayoutMenu,
	PageSidebarLayoutMenuAction,
	PageSidebarLayoutMenuBadge,
	PageSidebarLayoutMenuButton,
	PageSidebarLayoutMenuItem,
	PageSidebarLayoutMenuSkeleton,
	PageSidebarLayoutMenuSub,
	PageSidebarLayoutMenuSubButton,
	PageSidebarLayoutMenuSubItem,
	PageSidebarLayoutRail,
	PageSidebarLayoutSeparator,
	PageSidebarLayoutTrigger,
};
