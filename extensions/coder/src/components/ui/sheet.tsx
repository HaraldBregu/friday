import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Sheet = SheetPrimitive.Root;

export function SheetContent({
	className,
	children,
	...props
}: SheetPrimitive.Popup.Props) {
	return (
		<SheetPrimitive.Portal>
			<SheetPrimitive.Backdrop className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[1px]" />
			<SheetPrimitive.Popup
				className={cn(
					'fixed inset-y-0 left-0 z-50 flex w-[min(19rem,calc(100vw-3rem))] flex-col border-r bg-sidebar text-sidebar-foreground shadow-xl outline-none transition data-ending-style:-translate-x-8 data-ending-style:opacity-0 data-starting-style:-translate-x-8 data-starting-style:opacity-0',
					className
				)}
				{...props}
			>
				{children}
				<SheetPrimitive.Close
					render={
						<Button variant="ghost" size="icon-sm" className="absolute right-2 top-2">
							<X />
							<span className="sr-only">Close navigation</span>
						</Button>
					}
				/>
			</SheetPrimitive.Popup>
		</SheetPrimitive.Portal>
	);
}
