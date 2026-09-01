import { Button } from '@/components/ui/button';
import type { ExtensionTitlebarButton as ExtensionTitlebarButtonDescriptor } from '../../../../../shared/window_types';
import { ExtensionTitlebarIcon } from './ExtensionTitlebarIcon';

export function ExtensionTitlebarButton({
	button,
}: {
	button: ExtensionTitlebarButtonDescriptor;
}): React.JSX.Element {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			className="text-muted-foreground data-[pressed=true]:bg-accent data-[pressed=true]:text-foreground"
			data-pressed={button.pressed}
			aria-label={button.label}
			aria-expanded={button.expanded}
			aria-pressed={button.pressed}
			title={button.label}
			disabled={button.disabled}
			onClick={() => window.win.clickTitlebarButton(button.id)}
		>
			<ExtensionTitlebarIcon icon={button.icon} />
		</Button>
	);
}
