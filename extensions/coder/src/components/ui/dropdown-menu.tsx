import { Menu as MenuPrimitive } from '@base-ui/react/menu';

import { cn } from '@/lib/utils';

export function DropdownMenu(props: MenuPrimitive.Root.Props) {
	return <MenuPrimitive.Root {...props} />;
}

export function DropdownMenuTrigger(props: MenuPrimitive.Trigger.Props) {
	return <MenuPrimitive.Trigger {...props} />;
}

export function DropdownMenuContent({
	align = 'end',
	sideOffset = 4,
	className,
	...props
}: MenuPrimitive.Popup.Props &
	Pick<MenuPrimitive.Positioner.Props, 'align' | 'sideOffset'>) {
	return (
		<MenuPrimitive.Portal>
			<MenuPrimitive.Positioner align={align} sideOffset={sideOffset} className="z-50">
				<MenuPrimitive.Popup
					className={cn(
						'min-w-40 rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none',
						className
					)}
					{...props}
				/>
			</MenuPrimitive.Positioner>
		</MenuPrimitive.Portal>
	);
}

export function DropdownMenuItem({
	className,
	variant = 'default',
	...props
}: MenuPrimitive.Item.Props & { variant?: 'default' | 'destructive' }) {
	return (
		<MenuPrimitive.Item
			data-variant={variant}
			className={cn(
				'flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10',
				className
			)}
			{...props}
		/>
	);
}

export function DropdownMenuSeparator({
	className,
	...props
}: MenuPrimitive.Separator.Props) {
	return <MenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />;
}
