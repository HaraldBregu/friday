import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
	PageSidebarLayout,
	PageSidebarLayoutContent,
	PageSidebarLayoutGroup,
	PageSidebarLayoutGroupContent,
	PageSidebarLayoutGroupLabel,
	PageSidebarLayoutHeader,
	PageSidebarLayoutMenu,
	PageSidebarLayoutMenuButton,
	PageSidebarLayoutMenuItem,
} from '@/components/app/base/page';
import { SETTINGS_MODEL_SERVICE_ITEMS, SETTINGS_NAVIGATION } from './navigation';

const SETTINGS_SIDEBAR_ITEMS = [
	...SETTINGS_NAVIGATION.slice(0, 3),
	SETTINGS_MODEL_SERVICE_ITEMS[0],
	SETTINGS_NAVIGATION[12],
	SETTINGS_NAVIGATION[3],
	...SETTINGS_NAVIGATION.slice(8, 12),
	...SETTINGS_NAVIGATION.slice(13, 15),
	...SETTINGS_NAVIGATION.slice(4, 8),
	...SETTINGS_NAVIGATION.slice(15),
] as const;

const SETTINGS_SIDEBAR_GROUPS = [
	{
		id: 'general',
		items: SETTINGS_SIDEBAR_ITEMS.slice(0, 3),
	},
	{
		id: 'assistant',
		titleKey: 'settings.overview.groups.assistant',
		items: SETTINGS_SIDEBAR_ITEMS.slice(3, 12),
	},
	{
		id: 'providers',
		titleKey: 'settings.tabs.providers',
		items: SETTINGS_SIDEBAR_ITEMS.slice(12, 16),
	},
	{
		id: 'channels',
		items: SETTINGS_SIDEBAR_ITEMS.slice(16, 17),
	},
	{
		id: 'integrations',
		items: SETTINGS_SIDEBAR_ITEMS.slice(17),
	},
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
			<PageSidebarLayoutContent className="pt-3">
				<nav aria-label={t('settings.title')}>
					{SETTINGS_SIDEBAR_GROUPS.map((group) => (
						<PageSidebarLayoutGroup key={group.id} className="px-2 py-1 first:pt-0">
							{'titleKey' in group ? (
								<PageSidebarLayoutGroupLabel className="h-7 text-[10px] font-semibold uppercase tracking-[0.12em]">
									{t(group.titleKey)}
								</PageSidebarLayoutGroupLabel>
							) : null}
							<PageSidebarLayoutGroupContent>
								<PageSidebarLayoutMenu className="gap-1">
									{group.items.map((item) => {
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
							</PageSidebarLayoutGroupContent>
						</PageSidebarLayoutGroup>
					))}
				</nav>
			</PageSidebarLayoutContent>
		</PageSidebarLayout>
	);
}
