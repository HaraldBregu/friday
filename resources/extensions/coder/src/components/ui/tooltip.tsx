import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';

import { cn } from '@/lib/utils';

export function TooltipProvider(props: TooltipPrimitive.Provider.Props) {
	return <TooltipPrimitive.Provider delay={350} {...props} />;
}

export function Tooltip(props: TooltipPrimitive.Root.Props) {
	return <TooltipPrimitive.Root {...props} />;
}

export function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
	return <TooltipPrimitive.Trigger {...props} />;
}

export function TooltipContent({
	className,
	side = 'top',
	sideOffset = 6,
	children,
	...props
}: TooltipPrimitive.Popup.Props & Pick<TooltipPrimitive.Positioner.Props, 'side' | 'sideOffset'>) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Positioner side={side} sideOffset={sideOffset} className="z-50">
				<TooltipPrimitive.Popup
					className={cn(
						'max-w-64 rounded-md bg-foreground px-2 py-1 text-[11px] text-background shadow-md',
						className
					)}
					{...props}
				>
					{children}
				</TooltipPrimitive.Popup>
			</TooltipPrimitive.Positioner>
		</TooltipPrimitive.Portal>
	);
}
