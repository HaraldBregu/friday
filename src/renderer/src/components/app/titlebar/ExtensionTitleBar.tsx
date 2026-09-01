import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TitleBarCenterContainer } from './TitleBarCenterContainer';
import { TitleBarCenterContainerTitle } from './TitleBarCenterContainerTitle';
import { TitleBarContainer } from './TitleBarContainer';
import { TitleBarLeftContainer } from './TitleBarLeftContainer';
import { TitleBarRightContainer } from './TitleBarRightContainer';
import { ExtensionWindowControls } from './ExtensionWindowControls';
import { ExtensionTitlebarButton } from './ExtensionTitlebarButton';
import { useExtensionWindowState } from './hooks/useExtensionWindowState';
import type { ExtensionTitlebarButton as ExtensionTitlebarButtonDescriptor } from '../../../../../shared/window_types';

const isMac =
	typeof navigator !== 'undefined' &&
	(navigator.platform === 'MacIntel' || navigator.platform.startsWith('Mac'));

interface ExtensionTitleBarProps {
	title: string;
	leftButtons?: ExtensionTitlebarButtonDescriptor[];
	rightButtons?: ExtensionTitlebarButtonDescriptor[];
	sidebarWidth?: number | null;
}

export function ExtensionTitleBar({
	title,
	leftButtons = [],
	rightButtons = [],
	sidebarWidth = null,
}: ExtensionTitleBarProps): React.JSX.Element {
	const isMaximized = useExtensionWindowState();

	return (
		<TitleBarContainer className="relative">
			{sidebarWidth !== null ? (
				<div
					data-slot="extension-titlebar-sidebar"
					aria-hidden="true"
					className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden border-r border-b border-sidebar-border/50 bg-sidebar transition-[width] duration-200 ease-linear"
					style={{ width: sidebarWidth }}
				/>
			) : null}
			<TitleBarLeftContainer isMac={isMac}>
				{!isMac ? (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="ml-2 size-7 rounded-md text-muted-foreground"
						onClick={() => window.win.popupMenu()}
						title="Application menu"
						aria-label="Application menu"
					>
						<Menu className="size-[15px]" strokeWidth={1.5} />
					</Button>
				) : null}
				{leftButtons.map((button) => (
					<ExtensionTitlebarButton key={button.id} button={button} />
				))}
			</TitleBarLeftContainer>
			<TitleBarCenterContainer>
				<TitleBarCenterContainerTitle
					className={
						isMac ? 'max-w-[calc(100%-180px)] truncate' : 'max-w-[calc(100%-380px)] truncate'
					}
				>
					{title}
				</TitleBarCenterContainerTitle>
			</TitleBarCenterContainer>
			<div className="flex-1" />
			{rightButtons.length > 0 ? (
				<TitleBarRightContainer className={isMac ? 'mr-3' : undefined}>
					{rightButtons.map((button) => (
						<ExtensionTitlebarButton key={button.id} button={button} />
					))}
				</TitleBarRightContainer>
			) : null}
			{!isMac ? <ExtensionWindowControls isMaximized={isMaximized} /> : null}
		</TitleBarContainer>
	);
}
