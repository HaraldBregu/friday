import { useEffect, useState, type ReactElement } from 'react';
import { MessageSquare, Plus, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
	PageSidebarLayout,
	PageSidebarLayoutContent,
	PageSidebarLayoutFooter,
	PageSidebarLayoutHeader,
	PageSidebarLayoutMenu,
	PageSidebarLayoutMenuButton,
	PageSidebarLayoutMenuItem,
} from '@/components/app/base/page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_CHAT_SESSION_ID, useChatSession } from '@/contexts/chat-session';
import type { AgentSessionSummary } from '@/lib/compat';

interface HomeSidebarProps {
	readonly refreshKey: string;
}

export function HomeSidebar({ refreshKey }: HomeSidebarProps): ReactElement {
	const { t } = useTranslation();
	const { sessionId, setSessionId } = useChatSession();
	const [sessions, setSessions] = useState<AgentSessionSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let active = true;

		void window.agent
			.listSessions()
			.then((nextSessions) => {
				if (!active) return;
				setError(false);
				setSessions(nextSessions);
				setLoading(false);
			})
			.catch(() => {
				if (!active) return;
				setError(true);
				setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [refreshKey, sessionId]);

	const retrySessions = (): void => {
		setLoading(true);
		setError(false);
		void window.agent
			.listSessions()
			.then((nextSessions) => {
				setSessions(nextSessions);
				setLoading(false);
			})
			.catch(() => {
				setError(true);
				setLoading(false);
			});
	};

	const currentSessionId =
		sessionId === DEFAULT_CHAT_SESSION_ID ? sessions[0]?.id : sessionId;

	return (
		<PageSidebarLayout side="left" collapsible="offcanvas">
			<div
				aria-hidden="true"
				className="h-12 shrink-0 border-b border-sidebar-border/50"
				style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
			/>
			<PageSidebarLayoutHeader className="border-b border-sidebar-border/50 p-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-full justify-start"
					onClick={() => setSessionId(crypto.randomUUID())}
				>
					<Plus className="size-4" />
					{t('titleBar.newChat', 'New chat')}
				</Button>
			</PageSidebarLayoutHeader>
			<PageSidebarLayoutContent className="p-2 pt-3" aria-busy={loading}>
				<div className="px-2 pb-2 text-xs font-medium text-sidebar-foreground/70">
					{t('settings.chatHistory.title')}
				</div>
				{loading ? (
					<div className="grid gap-2 px-2 py-1" aria-label={t('settings.chatHistory.loading')}>
						{[0, 1, 2, 3].map((row) => (
							<Skeleton key={row} className="h-8 w-full" />
						))}
					</div>
				) : error ? (
					<div className="grid gap-2 px-2 py-1 text-xs text-muted-foreground">
						<p>{t('settings.chatHistory.errors.load')}</p>
						<Button type="button" variant="ghost" size="sm" onClick={retrySessions}>
							{t('settings.chatHistory.refresh')}
						</Button>
					</div>
				) : sessions.length === 0 ? (
					<p className="px-2 py-1 text-xs text-muted-foreground">
						{t('settings.chatHistory.empty')}
					</p>
				) : (
					<nav aria-label={t('settings.chatHistory.title')}>
						<PageSidebarLayoutMenu className="gap-1">
							{sessions.map((session) => {
								const title = session.title.trim() || t('settings.chatHistory.untitled');
								const isActive = session.id === currentSessionId;
								return (
									<PageSidebarLayoutMenuItem key={session.id}>
										<PageSidebarLayoutMenuButton
											isActive={isActive}
											aria-current={isActive ? 'page' : undefined}
											className="h-9 px-2.5"
											onClick={() => setSessionId(session.id)}
										>
											<MessageSquare strokeWidth={1.8} />
											<span>{title}</span>
										</PageSidebarLayoutMenuButton>
									</PageSidebarLayoutMenuItem>
								);
							})}
						</PageSidebarLayoutMenu>
					</nav>
				)}
			</PageSidebarLayoutContent>
			<PageSidebarLayoutFooter className="border-t border-sidebar-border/50">
				<PageSidebarLayoutMenu>
					<PageSidebarLayoutMenuItem>
						<PageSidebarLayoutMenuButton
							render={<Link to="/settings" />}
							className="h-9 px-2.5"
						>
							<Settings2 strokeWidth={1.8} />
							<span>{t('settings.title')}</span>
						</PageSidebarLayoutMenuButton>
					</PageSidebarLayoutMenuItem>
				</PageSidebarLayoutMenu>
			</PageSidebarLayoutFooter>
		</PageSidebarLayout>
	);
}
