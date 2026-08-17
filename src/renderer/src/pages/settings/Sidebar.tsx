import React from 'react';
import { Settings2 } from 'lucide-react';
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
import { SETTINGS_NAVIGATION } from './navigation';

const SETTINGS_SIDEBAR_ITEMS = [
	{
		path: '/settings',
		labelKey: 'settings.title',
		icon: Settings2,
	},
	...SETTINGS_NAVIGATION,
] as const;

export function SettingsSidebar(): React.JSX.Element {
	const { t } = useTranslation();
	const location = useLocation();

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
							const isActive =
								location.pathname === item.path ||
								(item.path !== '/settings' && location.pathname.startsWith(`${item.path}/`));
							const Icon = item.icon;

							return (
								<PageSidebarLayoutMenuItem key={item.path}>
									<PageSidebarLayoutMenuButton
										render={<Link to={item.path} />}
										isActive={isActive}
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
