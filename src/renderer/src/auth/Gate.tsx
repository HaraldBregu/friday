import React, { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import StartPage from '@/pages/start/StartPage';
import { isSetupComplete } from './setup';

export function StartupGate({ children }: { readonly children: ReactNode }): React.JSX.Element {
	const { state, localOnly, started } = useAuth();
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

	if (!started) {
		return location.pathname === '/start' ? <>{children}</> : <Navigate to="/start" replace />;
	}

	if ((state.status === 'loading' && !localOnly) || (userId && setupComplete === undefined)) {
		return <StartPage checking />;
	}

	if (state.status !== 'signedIn' && !localOnly) {
		return location.pathname === '/auth' ? <>{children}</> : <Navigate to="/auth" replace />;
	}

	if (!setupComplete) {
		return location.pathname === '/setup' ? <>{children}</> : <Navigate to="/setup" replace />;
	}

	if (
		location.pathname === '/' ||
		location.pathname === '/start' ||
		location.pathname === '/auth' ||
		location.pathname === '/setup'
	) {
		return <Navigate to="/home" replace />;
	}

	return <>{children}</>;
}
