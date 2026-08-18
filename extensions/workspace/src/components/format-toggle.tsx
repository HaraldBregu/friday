import { ToggleGroup } from './ui/toggle-group';
import { ToggleGroupItem } from './ui/toggle-item';

interface FormatToggleProps {
	formatted: boolean;
	onFormattedChange: (formatted: boolean) => void;
}

export function FormatToggle({ formatted, onFormattedChange }: FormatToggleProps) {
	return (
		<ToggleGroup
			type="single"
			value={formatted ? 'formatted' : ''}
			onValueChange={(value) => onFormattedChange(value === 'formatted')}
			aria-label="Markdown formatting"
		>
			<ToggleGroupItem value="formatted" aria-label="Formatted view">
				Formatted
			</ToggleGroupItem>
		</ToggleGroup>
	);
}
