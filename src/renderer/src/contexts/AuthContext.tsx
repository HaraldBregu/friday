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
	started: boolean;
	start: () => void;
	skipSignIn: () => void;
	requireSignIn: () => void;
}

const initialState: AuthState = { status: 'loading', persistence: 'memory' };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: ReactNode }): React.JSX.Element {
	const [state, setState] = useState<AuthState>(initialState);
	const [localOnly, setLocalOnly] = useState(false);
	const [started, setStarted] = useState(false);
	const applyState = useCallback((next: AuthState): void => {
		setState(next);
		if (next.status === 'signedIn' || next.status === 'recovery') {
			setLocalOnly(false);
		}
	}, []);
	const skipSignIn = useCallback((): void => {
		setLocalOnly(true);
	}, []);
	const start = useCallback((): void => {
		setStarted(true);
	}, []);
	const requireSignIn = useCallback((): void => {
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
		() => ({ state, localOnly, started, start, skipSignIn, requireSignIn }),
		[state, localOnly, started, start, skipSignIn, requireSignIn]
	);
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within an AuthProvider');
	return context;
}
