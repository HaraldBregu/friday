import type { Dispatch, SetStateAction } from 'react';
import type {
	CoderProject,
	CoderProviderId,
	CoderRunMode,
	CoderSessionSummary,
	CoderThinkingLevel,
	CoderToolMode,
} from '@friday/sdk';

export type RunState = 'loading' | 'idle' | 'running' | 'error';

export interface CoderMessageBlock {
	id: string;
	type: 'message';
	role: 'user' | 'assistant';
	content: string;
	status: 'streaming' | 'complete' | 'error';
	timestamp: string;
}

export interface CoderToolBlock {
	id: string;
	type: 'tool';
	toolName: string;
	status: 'running' | 'succeeded' | 'failed';
	timestamp: string;
}

export interface CoderCommandBlock {
	id: string;
	type: 'command';
	command: string;
	output: string;
	status: 'running' | 'succeeded' | 'failed' | 'cancelled';
	exitCode?: number;
	truncated: boolean;
	timestamp: string;
}

export type CoderBlock = CoderMessageBlock | CoderToolBlock | CoderCommandBlock;

export interface CoderController {
	activeProject?: CoderProject;
	activeProjectId?: string;
	activeSessionId?: string;
	blocks: CoderBlock[];
	busy: boolean;
	error: string;
	input: string;
	isPreview: boolean;
	leftOpen: boolean;
	loading: boolean;
	mode: CoderRunMode;
	modelId: string;
	projects: CoderProject[];
	providerId: CoderProviderId;
	query: string;
	runLabel: string;
	runState: RunState;
	sessions: CoderSessionSummary[];
	thinkingLevel: CoderThinkingLevel;
	toolMode: CoderToolMode;
	addProject: () => Promise<void>;
	cancelRun: () => void;
	newSession: () => void;
	removeProject: (projectId: string) => Promise<void>;
	selectProject: (projectId: string) => Promise<void>;
	selectSession: (sessionId: string) => Promise<void>;
	send: () => Promise<void>;
	setInput: Dispatch<SetStateAction<string>>;
	setLeftOpen: Dispatch<SetStateAction<boolean>>;
	setMode: Dispatch<SetStateAction<CoderRunMode>>;
	setQuery: Dispatch<SetStateAction<string>>;
}
