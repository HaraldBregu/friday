import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '@/contexts/useOnboarding';

export function StartupGate({ children }: { readonly children: ReactNode }): React.JSX.Element {
	const { phase } = useOnboarding();
	const location = useLocation();
	const onboardingPath =
		location.pathname === '/' ||
		location.pathname === '/start' ||
		location.pathname === '/auth' ||
		location.pathname === '/setup' ||
		location.pathname === '/config';
	const applicationPath = !onboardingPath;

	if (applicationPath && phase === 'checking') {
		return <div className="h-screen bg-background" aria-label="Loading application" />;
	}

	if (applicationPath && phase === 'ready') {
		return <>{children}</>;
	}

	if (phase !== 'ready') {
		return location.pathname === '/start' ? <>{children}</> : <Navigate to="/start" replace />;
	}

	if (onboardingPath) {
		return <Navigate to="/home" replace />;
	}

	return <>{children}</>;
}
