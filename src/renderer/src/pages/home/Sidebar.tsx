import { useEffect, useState, type ReactElement } from 'react';
import { CircleHelp, MessageSquare, Plus, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
	SPLIT_ITEM_ACTIVE_CLASS,
	SPLIT_ITEM_CLASS,
} from '@/components/app/base/page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_CHAT_SESSION_ID, useChatSession } from '@/contexts/chat-session';
import type { AgentSessionSummary } from '@/lib/compat';
import { cn } from '@/lib/utils';

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
		<div data-slot="home-sidebar" className="flex h-full min-h-0 flex-col">
			<div
				aria-hidden="true"
				className="h-12 shrink-0 border-b border-sidebar-border/50"
				style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
			/>
			<header className="border-b border-sidebar-border/50 p-2">
				<button
					type="button"
					className={SPLIT_ITEM_CLASS}
					onClick={() => setSessionId(crypto.randomUUID())}
				>
					<Plus className="size-4" />
					<span>{t('titleBar.newChat', 'New chat')}</span>
				</button>
			</header>
			<section className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-2 pt-3" aria-busy={loading}>
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
						<ul className="flex min-w-0 flex-col gap-1">
							{sessions.map((session) => {
								const title = session.title.trim() || t('settings.chatHistory.untitled');
								const isActive = session.id === currentSessionId;
								return (
									<li key={session.id}>
										<button
											type="button"
											data-active={isActive ? '' : undefined}
											aria-current={isActive ? 'page' : undefined}
											className={cn(SPLIT_ITEM_CLASS, isActive && SPLIT_ITEM_ACTIVE_CLASS)}
											onClick={() => setSessionId(session.id)}
										>
											<MessageSquare className="size-4 shrink-0" strokeWidth={1.8} />
											<span>{title}</span>
										</button>
									</li>
								);
							})}
						</ul>
					</nav>
				)}
			</section>
			<footer className="shrink-0 border-t border-sidebar-border/50 p-2">
				<div className="flex min-w-0 items-center gap-1">
					<Link
						to="/settings"
						aria-label={t('settings.title')}
						title={t('settings.title')}
						className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg px-1 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
					>
						<span
							className="flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white"
							aria-hidden="true"
						>
							<Settings2 className="size-3" strokeWidth={1.8} />
						</span>
						<span className="min-w-0 truncate text-sm font-medium">{t('settings.title')}</span>
					</Link>
					<button
						type="button"
						aria-label={t('menu.helpAndSupport')}
						title={t('menu.helpAndSupport')}
						onClick={() => void window.app.openExternalUrl(__APP_HOMEPAGE__)}
						className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-foreground/70 outline-none transition-colors hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
					>
						<CircleHelp className="size-4" strokeWidth={1.8} aria-hidden="true" />
					</button>
				</div>
			</footer>
		</div>
	);
}
