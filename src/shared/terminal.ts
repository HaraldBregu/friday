export interface TerminalCreateRequest {
	readonly id: string;
	readonly cwd?: string;
	readonly cols: number;
	readonly rows: number;
}

export interface TerminalSessionInfo {
	readonly id: string;
	readonly shell: string;
	readonly cwd: string;
	readonly cols: number;
	readonly rows: number;
	readonly createdAt: number;
}

export interface TerminalWriteRequest {
	readonly id: string;
	readonly data: string;
}

export interface TerminalResizeRequest {
	readonly id: string;
	readonly cols: number;
	readonly rows: number;
}

export interface TerminalKillRequest {
	readonly id: string;
}

export interface TerminalDataEvent {
	readonly id: string;
	readonly data: string;
}

export interface TerminalExitEvent {
	readonly id: string;
	readonly exitCode: number;
	readonly signal?: number;
}

export interface TerminalApi {
	create(request: TerminalCreateRequest): Promise<TerminalSessionInfo>;
	write(request: TerminalWriteRequest): void;
	resize(request: TerminalResizeRequest): void;
	kill(request: TerminalKillRequest): Promise<boolean>;
	onData(callback: (event: TerminalDataEvent) => void): () => void;
	onExit(callback: (event: TerminalExitEvent) => void): () => void;
}
