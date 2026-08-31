import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';
import type { AuthState } from '../../../shared/auth_types';

interface AuthContextValue {
	state: AuthState;
	localOnly: boolean;
	skipSignIn: () => void;
	requireSignIn: () => void;
}

const LOCAL_ONLY_KEY = 'friday-auth-local-only';
const initialState: AuthState = { status: 'loading', persistence: 'memory' };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: ReactNode }): React.JSX.Element {
	const [state, setState] = useState<AuthState>(initialState);
	const [localOnly, setLocalOnly] = useState(() => localStorage.getItem(LOCAL_ONLY_KEY) === 'true');
	const applyState = useCallback((next: AuthState): void => {
		setState(next);
		if (next.status === 'signedIn' || next.status === 'recovery') {
			localStorage.removeItem(LOCAL_ONLY_KEY);
			setLocalOnly(false);
		}
	}, []);
	const skipSignIn = useCallback((): void => {
		localStorage.setItem(LOCAL_ONLY_KEY, 'true');
		setLocalOnly(true);
	}, []);
	const requireSignIn = useCallback((): void => {
		localStorage.removeItem(LOCAL_ONLY_KEY);
		setLocalOnly(false);
	}, []);

	useEffect(() => {
		let mounted = true;
		const unsubscribe = window.auth.onStateChanged((next) => {
			if (mounted) applyState(next);
		});
		void window.auth
			.getState()
			.then((next) => {
				if (mounted) applyState(next);
			})
			.catch(() => {
				if (mounted) setState({ status: 'unconfigured', persistence: 'memory' });
			});
		return () => {
			mounted = false;
			unsubscribe();
		};
	}, [applyState]);

	const value = useMemo(
		() => ({ state, localOnly, skipSignIn, requireSignIn }),
		[state, localOnly, skipSignIn, requireSignIn]
	);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within an AuthProvider');
	return context;
}
