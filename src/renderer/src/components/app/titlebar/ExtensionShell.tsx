import { useEffect, useState } from 'react';
import { ExtensionTitleBar } from './ExtensionTitleBar';
import { useAppTheme } from './hooks/useAppTheme';

interface ExtensionShellProps {
	title: string;
}

export function ExtensionShell({ title }: ExtensionShellProps): React.JSX.Element {
	useAppTheme();
	const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);

	useEffect(() => window.win.onTitlebarSidebarWidthChanged(setSidebarWidth), []);

	return (
		<div className="app-translucent-window flex h-full flex-col overflow-hidden bg-background text-foreground">
			<ExtensionTitleBar title={title} sidebarWidth={sidebarWidth} />
		</div>
	);
}
