import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { isSetupComplete } from '@/auth/setup';
import { useAuth } from './AuthContext';
import { OnboardingContext, type OnboardingContextValue, type OnboardingPhase } from './onboarding';

type ConfigurationState = {
	identity?: string;
	status: 'idle' | 'checking' | 'incomplete' | 'complete';
};

export function OnboardingProvider({ children }: { readonly children: ReactNode }): React.JSX.Element {
	const { state, localOnly } = useAuth();
	const [started, setStarted] = useState(false);
	const [configuration, setConfiguration] = useState<ConfigurationState>({ status: 'idle' });
	const requestId = useRef(0);
	const identity = state.status === 'signedIn' ? state.user?.id : localOnly ? 'local' : undefined;
	const configurationStatus =
		configuration.identity === identity ? configuration.status : 'idle';

	const refreshConfiguration = useCallback(async (): Promise<boolean> => {
		if (!identity) {
			setConfiguration({ status: 'idle' });
			return false;
		}

		const currentRequest = ++requestId.current;
		setConfiguration({ identity, status: 'checking' });
		try {
			const complete = await isSetupComplete();
			if (requestId.current === currentRequest) {
				setConfiguration({ identity, status: complete ? 'complete' : 'incomplete' });
			}
			return complete;
		} catch {
			if (requestId.current === currentRequest) {
				setConfiguration({ identity, status: 'incomplete' });
			}
			return false;
		}
	}, [identity]);

	useEffect(() => {
		if ((!started && state.status !== 'recovery') || !identity) {
			requestId.current += 1;
			return;
		}

		const currentRequest = ++requestId.current;
		void isSetupComplete()
			.then((complete) => {
				if (requestId.current === currentRequest) {
					setConfiguration({ identity, status: complete ? 'complete' : 'incomplete' });
				}
			})
			.catch(() => {
				if (requestId.current === currentRequest) {
					setConfiguration({ identity, status: 'incomplete' });
				}
			});
		return () => {
			requestId.current += 1;
		};
	}, [identity, started, state.status]);

	let phase: OnboardingPhase;
	if (state.status === 'recovery') phase = 'auth';
	else if (!started) phase = 'landing';
	else if (state.status === 'loading' && !localOnly) phase = 'checking';
	else if (!identity) phase = 'auth';
	else if (configurationStatus === 'complete') phase = 'ready';
	else if (configurationStatus === 'incomplete') phase = 'setup';
	else phase = 'checking';

	const value = useMemo<OnboardingContextValue>(
		() => ({
			phase,
			start: () => setStarted(true),
			restart: () => setStarted(false),
			refreshConfiguration,
		}),
		[phase, refreshConfiguration]
	);

	return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
