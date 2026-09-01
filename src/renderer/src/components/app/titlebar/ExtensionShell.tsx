import { ExtensionTitleBar } from './ExtensionTitleBar';
import { useAppTheme } from './hooks/useAppTheme';

interface ExtensionShellProps {
	title: string;
}

export function ExtensionShell({ title }: ExtensionShellProps): React.JSX.Element {
	useAppTheme();
	return (
		<div className="app-translucent-window flex h-full flex-col overflow-hidden bg-background text-foreground">
			<ExtensionTitleBar title={title} />
		</div>
	);
}
