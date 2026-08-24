import { useEffect, useRef, useState, type RefObject } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { Terminal, type IDisposable } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

export type TerminalStatus =
	| { readonly phase: 'starting' | 'ready' }
	| { readonly phase: 'error' | 'exited'; readonly message: string };

export interface TerminalController {
	readonly containerRef: RefObject<HTMLDivElement | null>;
	readonly status: TerminalStatus;
}

export function useTerminal(): TerminalController {
	const containerRef = useRef<HTMLDivElement>(null);
	const [status, setStatus] = useState<TerminalStatus>({ phase: 'starting' });

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const id = crypto.randomUUID();
		const terminal = new Terminal({
			cursorBlink: true,
			cursorStyle: 'block',
			cursorInactiveStyle: 'outline',
			scrollback: 10_000,
			fontSize: 14,
			lineHeight: 1.15,
			letterSpacing: 0,
			fontFamily:
				'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
			macOptionIsMeta: true,
			scrollOnUserInput: true,
			theme: {
				background: '#0d1117',
				foreground: '#d7dde8',
				cursor: '#f0f4fa',
				cursorAccent: '#0d1117',
				selectionBackground: '#34557a99',
				black: '#1f2630',
				red: '#ff6b7a',
				green: '#7ee787',
				yellow: '#e3b341',
				blue: '#79c0ff',
				magenta: '#d2a8ff',
				cyan: '#56d4dd',
				white: '#d7dde8',
				brightBlack: '#768390',
				brightRed: '#ff938a',
				brightGreen: '#aff5b4',
				brightYellow: '#f2cc60',
				brightBlue: '#a5d6ff',
				brightMagenta: '#e2c5ff',
				brightCyan: '#86e1e9',
				brightWhite: '#f0f4fa',
			},
		});
		const fitAddon = new FitAddon();
		terminal.loadAddon(fitAddon);
		terminal.open(container);

		let webglAddon: WebglAddon | undefined;
		let contextLossSubscription: IDisposable | undefined;
		try {
			webglAddon = new WebglAddon();
			terminal.loadAddon(webglAddon);
			contextLossSubscription = webglAddon.onContextLoss(() => {
				webglAddon?.dispose();
				webglAddon = undefined;
			});
		} catch {
			webglAddon?.dispose();
			webglAddon = undefined;
		}

		fitAddon.fit();
		terminal.focus();
		let disposed = false;
		let created = false;
		let animationFrame: number | undefined;
		let lastSize = { cols: terminal.cols, rows: terminal.rows };
		let pendingInput = '';

		const removeDataListener = window.terminalAPI.onData((event) => {
			if (event.id === id && !disposed) terminal.write(event.data);
		});
		const removeExitListener = window.terminalAPI.onExit((event) => {
			if (event.id !== id || disposed) return;
			const signal = event.signal === undefined ? '' : `, signal ${event.signal}`;
			const message = `Process exited with code ${event.exitCode}${signal}.`;
			terminal.writeln(`\r\n\x1b[90m[${message}]\x1b[0m`);
			setStatus({ phase: 'exited', message });
		});
		const inputSubscription = terminal.onData((data) => {
			if (disposed) return;
			if (created) {
				window.terminalAPI.write({ id, data });
				return;
			}
			pendingInput = `${pendingInput}${data}`.slice(-1024 * 1024);
		});
		const focus = (): void => terminal.focus();
		container.addEventListener('pointerdown', focus);

		const resizeObserver = new ResizeObserver(() => {
			if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
			animationFrame = requestAnimationFrame(() => {
				animationFrame = undefined;
				if (disposed || container.clientWidth === 0 || container.clientHeight === 0) return;
				fitAddon.fit();
				if (
					created &&
					(terminal.cols !== lastSize.cols || terminal.rows !== lastSize.rows)
				) {
					lastSize = { cols: terminal.cols, rows: terminal.rows };
					window.terminalAPI.resize({ id, ...lastSize });
				}
			});
		});
		resizeObserver.observe(container);

		const createPromise = window.terminalAPI
			.create({ id, ...lastSize })
			.then(async () => {
				created = true;
				if (disposed) {
					await window.terminalAPI.kill({ id });
					return;
				}
				setStatus({ phase: 'ready' });
				if (pendingInput) {
					window.terminalAPI.write({ id, data: pendingInput });
					pendingInput = '';
				}
				if (terminal.cols !== lastSize.cols || terminal.rows !== lastSize.rows) {
					lastSize = { cols: terminal.cols, rows: terminal.rows };
					window.terminalAPI.resize({ id, ...lastSize });
				}
			})
			.catch((error: unknown) => {
				if (disposed) return;
				const message = error instanceof Error ? error.message : 'Unable to start the terminal.';
				terminal.writeln(`\r\n\x1b[31m${message}\x1b[0m`);
				setStatus({ phase: 'error', message });
			});

		return () => {
			disposed = true;
			resizeObserver.disconnect();
			if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
			container.removeEventListener('pointerdown', focus);
			removeDataListener();
			removeExitListener();
			inputSubscription.dispose();
			contextLossSubscription?.dispose();
			webglAddon?.dispose();
			fitAddon.dispose();
			terminal.dispose();
			if (created) void window.terminalAPI.kill({ id }).catch(() => undefined);
			else void createPromise;
		};
	}, []);

	return { containerRef, status };
}
