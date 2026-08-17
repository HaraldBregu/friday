import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
	PageSidebarLayout,
	PageSidebarLayoutContent,
	PageSidebarLayoutHeader,
	PageSidebarLayoutMenu,
	PageSidebarLayoutMenuButton,
	PageSidebarLayoutMenuItem,
} from '@/components/app/base/page';
import { SETTINGS_MODEL_SERVICE_ITEMS, SETTINGS_NAVIGATION } from './navigation';

const SETTINGS_SIDEBAR_ITEMS = [
	...SETTINGS_NAVIGATION.slice(0, 3),
	SETTINGS_MODEL_SERVICE_ITEMS[0],
	...SETTINGS_NAVIGATION.slice(3),
] as const;

export function SettingsSidebar(): React.JSX.Element {
	const { t } = useTranslation();
	const location = useLocation();
	const activePath = SETTINGS_SIDEBAR_ITEMS.reduce((currentPath, item) => {
		const matches =
			location.pathname === item.path ||
			(item.path !== '/settings' && location.pathname.startsWith(`${item.path}/`));
		return matches && item.path.length > currentPath.length ? item.path : currentPath;
	}, '');

	return (
		<PageSidebarLayout side="left" collapsible="offcanvas">
			<PageSidebarLayoutHeader
				aria-hidden="true"
				className="h-12 shrink-0 border-b border-sidebar-border/50 p-0"
				style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
			/>
			<PageSidebarLayoutContent className="p-2 pt-3">
				<nav aria-label={t('settings.title')}>
					<PageSidebarLayoutMenu className="gap-1">
						{SETTINGS_SIDEBAR_ITEMS.map((item) => {
							const Icon = item.icon;

							return (
								<PageSidebarLayoutMenuItem key={item.path}>
									<PageSidebarLayoutMenuButton
										render={<Link to={item.path} />}
										isActive={item.path === activePath}
										className="h-9 px-2.5"
									>
										<Icon strokeWidth={1.8} />
										<span>{t(item.labelKey)}</span>
									</PageSidebarLayoutMenuButton>
								</PageSidebarLayoutMenuItem>
							);
						})}
					</PageSidebarLayoutMenu>
				</nav>
			</PageSidebarLayoutContent>
		</PageSidebarLayout>
	);
}
