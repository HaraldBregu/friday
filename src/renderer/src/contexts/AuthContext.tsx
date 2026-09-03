import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
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

const initialState: AuthState = { status: 'loading', persistence: 'memory' };
const LOCAL_ONLY_SESSION_KEY = 'kucedr-auth-local-only';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: ReactNode }): React.JSX.Element {
	const [state, setState] = useState<AuthState>(initialState);
	const [localOnly, setLocalOnly] = useState(
		() => window.sessionStorage.getItem(LOCAL_ONLY_SESSION_KEY) === 'true'
	);
	const currentStatus = useRef<AuthState['status']>(initialState.status);
	const applyState = useCallback((next: AuthState): void => {
		const wasAuthenticated =
			currentStatus.current === 'signedIn' || currentStatus.current === 'recovery';
		if (wasAuthenticated && next.status === 'signedOut') {
			window.sessionStorage.setItem(LOCAL_ONLY_SESSION_KEY, 'true');
			setLocalOnly(true);
		} else if (next.status === 'signedIn' || next.status === 'recovery') {
			window.sessionStorage.removeItem(LOCAL_ONLY_SESSION_KEY);
			setLocalOnly(false);
		}
		currentStatus.current = next.status;
		setState(next);
	}, []);
	const skipSignIn = useCallback((): void => {
		window.sessionStorage.setItem(LOCAL_ONLY_SESSION_KEY, 'true');
		setLocalOnly(true);
	}, []);
	const requireSignIn = useCallback((): void => {
		window.sessionStorage.removeItem(LOCAL_ONLY_SESSION_KEY);
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
