import React, { type ReactNode } from 'react';
import { Menu, PanelLeft, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { TitleBarContainer } from './TitleBarContainer';
import { TitleBarCenterContainer } from './TitleBarCenterContainer';
import { TitleBarLeftContainer } from './TitleBarLeftContainer';
import { TitleBarCenterContainerTitle } from './TitleBarCenterContainerTitle';
import { Button } from '@/components/ui/button';
import { TitleBarProvider } from './context/TitleBarContext';
import { NavButton } from './components/NavButton';
// import { NavigationButtons } from './components/NavigationButtons';
import { SessionsButton } from './components/SessionsButton';
import { WindowControls } from './components/WindowControls';
import { useWindowState } from './hooks/useWindowState';
import { GradientSphere } from '@/components/ui/gradient-sphere';

// Synchronous platform check — no hooks, no async, no state.
// macOS uses native traffic-light buttons; every other OS needs custom controls.
const isMac =
	typeof navigator !== 'undefined' &&
	(navigator.platform === 'MacIntel' || navigator.platform.startsWith('Mac'));

export interface TitleBarProps {
	/** Optional class applied to the title bar container */
	className?: string;
	/** Optional inline style applied to the title bar container */
	style?: React.CSSProperties;
	/** Text displayed centered in the title bar */
	title?: string;
	/** Custom content rendered in the center, replaces the title */
	centerContent?: ReactNode;
	/** Custom content rendered on the right before window controls */
	rightContent?: ReactNode;
	/** Called when the sidebar toggle button is clicked */
	onToggleSidebar?: () => void;
	/** When true, renders agentic + info sidebar toggle buttons on the right */
	showSidebarToggles?: boolean;
}

export const TitleBar = React.memo(function TitleBar({
	className,
	style,
	title = 'Application Name',
	centerContent,
	rightContent,
	onToggleSidebar,
	showSidebarToggles: _showSidebarToggles = false,
}: TitleBarProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { isFullScreen } = useWindowState();

	const isHome = location.pathname === '/home';
	const isStart = location.pathname === '/start';
	const isSettings = location.pathname.startsWith('/settings');
	const settingsLabel = t('settings.title', 'Settings');
	const titleBarTitle = isSettings ? settingsLabel : title;
	const homeButtonLabel = t('titleBar.home', 'Home');
	const routeButton = isSettings ? (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className="size-8 rounded-full"
			onClick={() => navigate('/home')}
			title={homeButtonLabel}
			aria-label={homeButtonLabel}
		>
			<GradientSphere size={18} className="pointer-events-none" />
		</Button>
	) : !isStart ? (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className="size-8 rounded-full"
			onClick={() => navigate('/settings')}
			title={settingsLabel}
			aria-label={settingsLabel}
		>
			<User className="size-4" strokeWidth={1.8} />
		</Button>
	) : null;
	const sessionsButton = isHome ? <SessionsButton /> : null;

	return (
		<TitleBarProvider value={{ isMac, isFullScreen }}>
			<TitleBarContainer
				className={className}
				style={style}
				onContextMenu={(event) => {
					if (event.target instanceof Element && event.target.closest('button')) {
						return;
					}

					event.preventDefault();
					void window.win
						.showContextMenu([
							{ id: '/settings/general', label: t('settings.tabs.general') },
							{
								id: '/settings/assistant',
								label: t('settings.overview.groups.agent'),
							},
							{ id: '/settings/system', label: t('settings.tabs.system') },
							{ id: '/settings/extensions', label: t('settings.tabs.extensions') },
						])
						.then((path) => {
							if (path) navigate(path);
						});
				}}
			>
				{/* ── Left: platform menu + sidebar toggle + nav buttons ── */}
				<TitleBarLeftContainer isMac={isMac} isFullScreen={isFullScreen}>
					{!isMac && (
						<button
							type="button"
							onClick={() => window.win?.popupMenu()}
							className="ml-2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground"
							title={t('titleBar.applicationMenu')}
						>
							<Menu className="h-[15px] w-[15px]" strokeWidth={1.5} />
						</button>
					)}

					{!isMac && routeButton}
					{!isMac && sessionsButton}

					{!isHome && !isStart && !isSettings && (
						<Button
							type="button"
							variant="default"
							size="xs"
							onClick={() => navigate('/home')}
							title={homeButtonLabel}
						>
							{homeButtonLabel}
						</Button>
					)}

					{onToggleSidebar && (
						<NavButton
							onClick={onToggleSidebar}
							title={t('titleBar.toggleSidebar')}
							className={!isMac ? 'hover:bg-transparent hover:text-muted-foreground transition-none' : ''}
						>
							<PanelLeft className="h-[15px] w-[15px]" strokeWidth={1.5} />
						</NavButton>
					)}

					{/* {isSettings && <NavigationButtons />} */}
				</TitleBarLeftContainer>

				{/* ── Center: absolutely placed so it's always truly centered ── */}
				<TitleBarCenterContainer className={isSettings ? 'justify-start pl-12' : undefined}>
					{centerContent && !isSettings ? (
						centerContent
					) : (
						<TitleBarCenterContainerTitle>{titleBarTitle}</TitleBarCenterContainerTitle>
					)}
				</TitleBarCenterContainer>

				<div className="flex-1" />

				{rightContent && (
					<div
						className="z-10 mr-3 flex h-full items-center"
						style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
					>
						{rightContent}
					</div>
				)}

				{/* ── Right action: home/settings toggle ── */}
				{isMac && routeButton && (
					<div
						className="z-10 mr-3 flex h-full items-center gap-1"
						style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
					>
						{sessionsButton}
						{routeButton}
					</div>
				)}

				{/* ── Windows only: minimize / close ── */}
				{!isMac && <WindowControls />}
			</TitleBarContainer>
		</TitleBarProvider>
	);
});
TitleBar.displayName = 'TitleBar';
