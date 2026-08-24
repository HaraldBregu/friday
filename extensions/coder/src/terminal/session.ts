import { useEffect, useRef, useState, type RefObject } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { Terminal } from '@xterm/xterm';
import { terminal } from '@friday/sdk';

type TerminalStatus =
	| { state: 'starting'; message: string }
	| { state: 'running'; message: string }
	| { state: 'exited'; message: string }
	| { state: 'error'; message: string };

interface TerminalController {
	readonly containerRef: RefObject<HTMLDivElement | null>;
	readonly status: TerminalStatus;
}

const maximumPendingInputLength = 1024 * 1024;

export function useTerminalSession(cwd?: string): TerminalController {
	const containerRef = useRef<HTMLDivElement>(null);
	const [status, setStatus] = useState<TerminalStatus>({
		state: 'starting',
		message: 'Starting shell…',
	});

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const id = `terminal-${crypto.randomUUID()}`;
		const xterm = new Terminal({
			cursorBlink: true,
			cursorStyle: 'block',
			fontFamily:
				"'SFMono-Regular', 'Cascadia Code', 'Liberation Mono', Menlo, Consolas, monospace",
			fontSize: 14,
			lineHeight: 1.2,
			macOptionIsMeta: true,
			scrollback: 10_000,
			theme: {
				background: '#0f111a',
				foreground: '#d8dee9',
				cursor: '#f8f8f2',
				cursorAccent: '#0f111a',
				selectionBackground: '#3b425280',
				black: '#3b4252',
				red: '#bf616a',
				green: '#a3be8c',
				yellow: '#ebcb8b',
				blue: '#81a1c1',
				magenta: '#b48ead',
				cyan: '#88c0d0',
				white: '#e5e9f0',
				brightBlack: '#4c566a',
				brightRed: '#d06f79',
				brightGreen: '#b1d196',
				brightYellow: '#f0d399',
				brightBlue: '#8fbcbb',
				brightMagenta: '#c895bf',
				brightCyan: '#93ccdc',
				brightWhite: '#eceff4',
			},
		});
		const fitAddon = new FitAddon();
		xterm.loadAddon(fitAddon);
		xterm.open(container);

		try {
			const webglAddon = new WebglAddon();
			webglAddon.onContextLoss(() => webglAddon.dispose());
			xterm.loadAddon(webglAddon);
		} catch {
			// xterm keeps its built-in renderer when WebGL is unavailable.
		}

		let created = false;
		let disposed = false;
		let pendingInput = '';
		let animationFrame = 0;
		let lastCols = xterm.cols;
		let lastRows = xterm.rows;

		const fitAndResize = (): void => {
			animationFrame = 0;
			if (!container.isConnected || container.clientWidth === 0 || container.clientHeight === 0) {
				return;
			}
			fitAddon.fit();
			if (!created || (xterm.cols === lastCols && xterm.rows === lastRows)) return;
			lastCols = xterm.cols;
			lastRows = xterm.rows;
			terminal.resize({ id, cols: lastCols, rows: lastRows });
		};
		const scheduleFit = (): void => {
			if (animationFrame !== 0) return;
			animationFrame = requestAnimationFrame(fitAndResize);
		};

		fitAddon.fit();
		lastCols = xterm.cols;
		lastRows = xterm.rows;

		const unsubscribeData = terminal.onData((event) => {
			if (!disposed && event.id === id) xterm.write(event.data);
		});
		const unsubscribeExit = terminal.onExit((event) => {
			if (disposed || event.id !== id) return;
			created = false;
			xterm.options.disableStdin = true;
			setStatus({
				state: 'exited',
				message: `Process exited with code ${event.exitCode}`,
			});
			xterm.writeln(`\r\n\x1b[2m[Process exited with code ${event.exitCode}]\x1b[0m`);
		});
		const inputDisposable = xterm.onData((data) => {
			if (created) {
				terminal.write({ id, data });
				return;
			}
			if (pendingInput.length + data.length <= maximumPendingInputLength) pendingInput += data;
		});
		const focus = (): void => xterm.focus();
		container.addEventListener('pointerdown', focus);

		const resizeObserver = new ResizeObserver(scheduleFit);
		resizeObserver.observe(container);

		void terminal
			.create({ id, cwd, cols: lastCols, rows: lastRows })
			.then(async (session) => {
				if (disposed) {
					await terminal.kill({ id }).catch(() => false);
					return;
				}
				created = true;
				setStatus({ state: 'running', message: session.shell });
				if (pendingInput) {
					terminal.write({ id, data: pendingInput });
					pendingInput = '';
				}
				xterm.focus();
				scheduleFit();
			})
			.catch((error: unknown) => {
				if (disposed) return;
				const message = error instanceof Error ? error.message : 'Unable to start the terminal.';
				xterm.options.disableStdin = true;
				setStatus({ state: 'error', message });
				xterm.writeln(`\r\n\x1b[31m${message}\x1b[0m`);
			});

		return () => {
			disposed = true;
			if (animationFrame !== 0) cancelAnimationFrame(animationFrame);
			resizeObserver.disconnect();
			container.removeEventListener('pointerdown', focus);
			inputDisposable.dispose();
			unsubscribeData();
			unsubscribeExit();
			if (created) void terminal.kill({ id }).catch(() => false);
			xterm.dispose();
		};
	}, [cwd]);

	return { containerRef, status };
}
