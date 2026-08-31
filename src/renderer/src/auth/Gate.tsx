import React, { useEffect, useState, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { LogoView } from '@/components/app/base/logo-view';
import { useAuth } from '@/contexts/AuthContext';
import { isSetupComplete } from './setup';

export function StartupGate({ children }: { readonly children: ReactNode }): React.JSX.Element {
	const { state, localOnly } = useAuth();
	const location = useLocation();
	const [setup, setSetup] = useState<{ userId: string; path: string; complete: boolean }>();
	const userId = state.status === 'signedIn' ? state.user?.id : localOnly ? 'local' : undefined;
	const setupComplete =
		setup && setup.userId === userId && (setup.complete || setup.path === location.pathname)
			? setup.complete
			: undefined;

	useEffect(() => {
		if (!userId) return;
		if (setup?.userId === userId && (setup.complete || setup.path === location.pathname)) return;
		let active = true;
		const path = location.pathname;
		void isSetupComplete()
			.then((complete) => {
				if (active) setSetup({ userId, path, complete });
			})
			.catch(() => {
				if (active) setSetup({ userId, path, complete: false });
			});
		return () => {
			active = false;
		};
	}, [location.pathname, setup?.complete, setup?.path, setup?.userId, userId]);

	if ((state.status === 'loading' && !localOnly) || (userId && setupComplete === undefined)) {
		return (
			<main className="app-translucent-window flex h-screen items-center justify-center bg-background text-foreground">
				<div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
					<LogoView className="size-16 rounded-xl" />
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
						Checking your session…
					</div>
				</div>
			</main>
		);
	}

	if (state.status !== 'signedIn' && !localOnly) {
		return location.pathname === '/auth' ? <>{children}</> : <Navigate to="/auth" replace />;
	}

	if (!setupComplete) {
		return location.pathname === '/setup' ? <>{children}</> : <Navigate to="/setup" replace />;
	}

	if (location.pathname === '/' || location.pathname === '/auth' || location.pathname === '/setup') {
		return <Navigate to="/home" replace />;
	}

	return <>{children}</>;
}
