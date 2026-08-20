import type { Dispatch, SetStateAction } from 'react';
import type {
	CoderProviderId,
	CoderThinkingLevel,
	CoderToolMode,
} from '@friday/sdk';

export type RunState = 'idle' | 'running' | 'error';

export interface CoderMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	status?: 'streaming' | 'complete' | 'error';
}

export interface CoderActivity {
	id: string;
	name: string;
	status: 'running' | 'ok' | 'error';
	detail: string;
}

export interface CoderController {
	activities: CoderActivity[];
	error: string;
	input: string;
	isPreview: boolean;
	leftOpen: boolean;
	messages: CoderMessage[];
	modelId: string;
	providerId: CoderProviderId;
	runLabel: string;
	runState: RunState;
	thinkingLevel: CoderThinkingLevel;
	toolMode: CoderToolMode;
	workingDirectory: string;
	workspaceName: string;
	cancelRun: () => void;
	clearTerminal: () => void;
	send: () => Promise<void>;
	setInput: Dispatch<SetStateAction<string>>;
	setLeftOpen: Dispatch<SetStateAction<boolean>>;
}
