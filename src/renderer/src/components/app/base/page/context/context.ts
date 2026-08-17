import { createContext, type Dispatch } from 'react';
import type { PageState } from './state';
import type { PageAction } from './actions';

export interface ContextValue {
	state: PageState;
	dispatch: Dispatch<PageAction>;
	isMobile: boolean;
	sidebarWidth: number;
	setSidebarWidth: (width: number) => void;
	toggleSidebar: () => void;
}

export const PageContext = createContext<ContextValue | null>(null);
