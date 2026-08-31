import { createContext } from 'react';

export type OnboardingPhase = 'landing' | 'auth' | 'checking' | 'setup' | 'ready';

export interface OnboardingContextValue {
	phase: OnboardingPhase;
	start: () => void;
	restart: () => void;
	refreshConfiguration: () => Promise<boolean>;
}

export const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);
