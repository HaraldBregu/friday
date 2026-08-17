import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PageContainer } from '@/components/app/base/page';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useTranslation } from 'react-i18next';
import { useSettingsBreadcrumbItems } from './hooks';
import { SettingsSidebar } from './Sidebar';

function SettingsBreadcrumbHeader(): React.JSX.Element | null {
	const { t } = useTranslation();
	const items = useSettingsBreadcrumbItems();

	if (items.length === 0) return null;

	return (
		<header className="sticky top-0 z-20 border-b border-border/50 bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
			<nav
				aria-label={t('settings.breadcrumb.label')}
				className="mx-auto flex w-full max-w-4xl min-w-0 items-center gap-1 text-[11px] text-muted-foreground"
			>
				{items.map((item, index) => (
					<React.Fragment key={`${item.label}-${index}`}>
						{index > 0 ? (
							<ChevronRight
								className="size-3 shrink-0 text-muted-foreground/60"
								strokeWidth={1.8}
							/>
						) : null}
						{item.path ? (
							<Link
								to={item.path}
								className="min-w-0 rounded-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/55"
							>
								{item.label}
							</Link>
						) : (
							<span className="min-w-0 truncate font-medium text-foreground">
								{item.label}
							</span>
						)}
					</React.Fragment>
				))}
			</nav>
		</header>
	);
}

export function Layout(): React.JSX.Element {
	return (
		<PageContainer className="bg-muted/20">
			<SidebarProvider className="h-full min-h-0">
				<SettingsSidebar />
				<SidebarInset className="min-h-0 min-w-0 overflow-hidden">
					<div data-slot="settings-workspace" className="min-h-0 flex-1 overflow-y-auto">
						<SettingsBreadcrumbHeader />
						<div className="py-6">
							<Outlet />
						</div>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</PageContainer>
	);
}
