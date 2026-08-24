import type { WebContents } from 'electron';
import type { IDisposable, IPty } from 'node-pty';

export interface TerminalSession {
	readonly id: string;
	readonly shell: string;
	readonly args: string[];
	readonly cwd: string;
	cols: number;
	rows: number;
	readonly process: IPty;
	readonly createdAt: number;
	exited: boolean;
	readonly owner: WebContents;
	readonly dataSubscription: IDisposable;
	exitSubscription?: IDisposable;
}
