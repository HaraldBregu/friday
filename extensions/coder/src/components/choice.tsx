import { Check, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ChoiceOption {
	readonly value: string;
	readonly label: string;
}

export function Choice({
	value,
	options,
	disabled,
	onChange,
}: {
	value: string;
	options: readonly ChoiceOption[];
	disabled?: boolean;
	onChange: (value: string) => void;
}) {
	const selected = options.find((option) => option.value === value);
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				disabled={disabled}
				render={
					<Button variant="outline" size="sm" className="min-w-40 justify-between font-normal">
						<span className="truncate">{selected?.label ?? 'Select'}</span>
						<ChevronDown />
					</Button>
				}
			/>
			<DropdownMenuContent className="min-w-48">
				{options.map((option) => (
					<DropdownMenuItem key={option.value} onClick={() => onChange(option.value)}>
						<span className="min-w-0 flex-1 truncate">{option.label}</span>
						{option.value === value ? <Check className="ml-auto" /> : null}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
