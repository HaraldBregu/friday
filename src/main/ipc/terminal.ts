import { BrowserWindow, ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron';
import { TerminalChannels } from '../../shared/ipc_channels_definitions';
import type {
	TerminalCreateRequest,
	TerminalKillRequest,
	TerminalResizeRequest,
	TerminalWriteRequest,
} from '../../shared/terminal';
import type { EventBus } from '../event_bus';
import type { ExtensionRegistry } from '../extensions/extension_registry';
import type { LoggerService } from '../shared';
import type { PtyManager } from '../terminal/manager';
import type { WindowContextManager } from '../window_context';
import { wrapIpcHandler } from './core/error_handler';
import type { IpcModule } from './core/module';

const terminalIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{7,127}$/;
const maximumTerminalDataLength = 1024 * 1024;
const maximumCwdLength = 4096;
const maximumDimension = 1000;

export interface TerminalIpcDeps {
	readonly logger: LoggerService;
	readonly manager: PtyManager;
	readonly windows: WindowContextManager;
	readonly extensions: ExtensionRegistry;
}

export class TerminalIpc implements IpcModule<TerminalIpcDeps> {
	readonly name = 'terminal';

	register({ logger, manager, windows, extensions }: TerminalIpcDeps, _eventBus: EventBus): void {
		ipcMain.handle(
			TerminalChannels.create,
			wrapIpcHandler(async (event, value: unknown) => {
				this.assertTrustedSender(event, windows, extensions);
				const request = this.createRequest(value);
				return manager.create(event.sender, request);
			}, TerminalChannels.create)
		);

		ipcMain.handle(
			TerminalChannels.kill,
			wrapIpcHandler((event, value: unknown) => {
				this.assertTrustedSender(event, windows, extensions);
				const request = this.killRequest(value);
				return manager.kill(event.sender.id, request.id);
			}, TerminalChannels.kill)
		);

		ipcMain.on(TerminalChannels.write, (event, value: unknown) => {
			try {
				this.assertTrustedSender(event, windows, extensions);
				const request = this.writeRequest(value);
				manager.write(event.sender.id, request.id, request.data);
			} catch (error) {
				logger.warn('TerminalIpc', 'Rejected terminal input', error);
			}
		});

		ipcMain.on(TerminalChannels.resize, (event, value: unknown) => {
			try {
				this.assertTrustedSender(event, windows, extensions);
				const request = this.resizeRequest(value);
				manager.resize(event.sender.id, request.id, request.cols, request.rows);
			} catch (error) {
				logger.warn('TerminalIpc', 'Rejected terminal resize', error);
			}
		});

		logger.info('TerminalIpc', `Registered ${this.name} module`);
	}

	private assertTrustedSender(
		event: IpcMainEvent | IpcMainInvokeEvent,
		windows: WindowContextManager,
		extensions: ExtensionRegistry
	): void {
		if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame) {
			throw new Error('Terminal IPC is restricted to the main frame.');
		}
		if (extensions.has(event.sender)) {
			throw new Error('Terminal IPC is unavailable to extension views.');
		}
		const window = BrowserWindow.fromWebContents(event.sender);
		if (!window || window.webContents !== event.sender || !windows.has(window.id)) {
			throw new Error('Terminal IPC is unavailable to this renderer.');
		}
	}

	private createRequest(value: unknown): TerminalCreateRequest {
		const record = this.record(value);
		const id = this.id(record.id);
		const cols = this.dimension(record.cols, 'columns');
		const rows = this.dimension(record.rows, 'rows');
		if (
			record.cwd !== undefined &&
			(typeof record.cwd !== 'string' ||
				record.cwd.length === 0 ||
				record.cwd.length > maximumCwdLength ||
				record.cwd.includes('\0'))
		) {
			throw new Error('Terminal working directory is invalid.');
		}
		return { id, cols, rows, ...(record.cwd === undefined ? {} : { cwd: record.cwd }) };
	}

	private writeRequest(value: unknown): TerminalWriteRequest {
		const record = this.record(value);
		if (
			typeof record.data !== 'string' ||
			record.data.length === 0 ||
			record.data.length > maximumTerminalDataLength
		) {
			throw new Error('Terminal input is invalid.');
		}
		return { id: this.id(record.id), data: record.data };
	}

	private resizeRequest(value: unknown): TerminalResizeRequest {
		const record = this.record(value);
		return {
			id: this.id(record.id),
			cols: this.dimension(record.cols, 'columns'),
			rows: this.dimension(record.rows, 'rows'),
		};
	}

	private killRequest(value: unknown): TerminalKillRequest {
		return { id: this.id(this.record(value).id) };
	}

	private record(value: unknown): Record<string, unknown> {
		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			throw new Error('Terminal request must be an object.');
		}
		return value as Record<string, unknown>;
	}

	private id(value: unknown): string {
		if (typeof value !== 'string' || !terminalIdPattern.test(value)) {
			throw new Error('Terminal session ID is invalid.');
		}
		return value;
	}

	private dimension(value: unknown, label: string): number {
		if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > maximumDimension) {
			throw new Error(`Terminal ${label} must be an integer from 1 to ${maximumDimension}.`);
		}
		return value as number;
	}
}
