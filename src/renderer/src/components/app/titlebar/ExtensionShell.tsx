import { useEffect, useState } from 'react';
import { ExtensionTitleBar } from './ExtensionTitleBar';
import { useAppTheme } from './hooks/useAppTheme';
import type { ExtensionTitlebarOptions } from '../../../../../shared/window_types';

interface ExtensionShellProps {
	title: string;
}

export function ExtensionShell({ title }: ExtensionShellProps): React.JSX.Element {
	useAppTheme();
	const [options, setOptions] = useState<ExtensionTitlebarOptions | null>(null);
	const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
	const [sidebarTransitionDelay, setSidebarTransitionDelay] = useState<number>();

	useEffect(() => {
		const stopOptions = window.win.onTitlebarOptionsChanged((nextOptions) => {
			setOptions(nextOptions);
			setSidebarTransitionDelay(
				nextOptions?.sidebarTransitionStartedAt === undefined
					? undefined
					: -Math.min(
							200,
							Math.max(0, Date.now() - nextOptions.sidebarTransitionStartedAt + 5)
						)
			);
		});
		const stopSidebarWidth = window.win.onTitlebarSidebarWidthChanged(setSidebarWidth);
		return () => {
			stopOptions();
			stopSidebarWidth();
		};
	}, []);

	return (
		<div className="app-translucent-window flex h-full flex-col overflow-hidden bg-background text-foreground">
			<ExtensionTitleBar
				title={options?.title ?? title}
				leftButtons={options?.leftButtons ?? []}
				rightButtons={options?.rightButtons ?? []}
				sidebarOpen={options?.sidebarOpen}
				sidebarTransitionDelay={sidebarTransitionDelay}
				sidebarWidth={options ? (options.sidebarWidth ?? null) : sidebarWidth}
			/>
		</div>
	);
}
