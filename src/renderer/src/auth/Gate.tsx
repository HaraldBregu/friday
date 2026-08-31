import React, { useEffect, useState, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { LogoView } from '@/components/app/base/logo-view';
import { useAuth } from '@/contexts/AuthContext';
import { isSetupComplete } from './setup';

export function StartupGate({ children }: { readonly children: ReactNode }): React.JSX.Element {
	const { state } = useAuth();
	const location = useLocation();
	const [setupComplete, setSetupComplete] = useState<boolean>();

	useEffect(() => {
		if (state.status !== 'signedIn') {
			setSetupComplete(undefined);
			return;
		}
		let active = true;
		void isSetupComplete()
			.then((complete) => {
				if (active) setSetupComplete(complete);
			})
			.catch(() => {
				if (active) setSetupComplete(false);
			});
		return () => {
			active = false;
		};
	}, [state.status, state.user?.id]);

	if (state.status === 'loading' || (state.status === 'signedIn' && setupComplete === undefined)) {
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

	if (state.status !== 'signedIn') {
		return location.pathname === '/auth' ? <>{children}</> : <Navigate to="/auth" replace />;
	}

	if (!setupComplete) {
		return location.pathname === '/start' ? <>{children}</> : <Navigate to="/start" replace />;
	}

	if (location.pathname === '/' || location.pathname === '/auth' || location.pathname === '/start') {
		return <Navigate to="/home" replace />;
	}

	return <>{children}</>;
}
