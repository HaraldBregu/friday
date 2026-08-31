import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthState } from '../../../shared/auth_types';

interface AuthContextValue {
	state: AuthState;
}

const initialState: AuthState = { status: 'loading', persistence: 'memory' };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: ReactNode }): React.JSX.Element {
	const [state, setState] = useState<AuthState>(initialState);

	useEffect(() => {
		let mounted = true;
		const unsubscribe = window.auth.onStateChanged((next) => {
			if (mounted) setState(next);
		});
		void window.auth
			.getState()
			.then((next) => {
				if (mounted) setState(next);
			})
			.catch(() => {
				if (mounted) setState({ status: 'unconfigured', persistence: 'memory' });
			});
		return () => {
			mounted = false;
			unsubscribe();
		};
	}, []);

	const value = useMemo(() => ({ state }), [state]);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within an AuthProvider');
	return context;
}
