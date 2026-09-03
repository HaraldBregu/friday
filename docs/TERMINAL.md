# Terminal IPC Architecture

Friday provides a backend API for local interactive shells backed by real operating-system
pseudoterminals. It does not implement a terminal renderer in the main Friday UI.

## Data flow

```text
Main renderer input -> terminalAPI -> validated Electron IPC -> PtyManager -> node-pty
node-pty output -> owner-only Electron IPC -> terminalAPI event -> main renderer
Main renderer resize -> terminalAPI -> node-pty resize
```

`node-pty` runs only in the Electron main process. The preload exposes a narrow typed API and never
exposes `ipcRenderer`, `require`, `fs`, `child_process`, or `node-pty`. Callers cannot choose an
executable. Every terminal belongs to the approved `webContents` that created it. Only trusted main
windows may create terminals; extension views, unknown
renderers, subframes, and other owners cannot control that session.

macOS sessions merge the Finder/Dock environment with the user's login-shell environment through
`shell-env`, then set only terminal-specific variables (`TERM`, `COLORTERM`, and `TERM_PROGRAM`).
Windows prefers PowerShell 7, then Windows PowerShell, then Command Prompt. Unix systems prefer
`$SHELL`, then zsh, bash, and sh.

## Development

Native build requirements are Xcode Command Line Tools on macOS, Visual Studio Build Tools with the
Desktop C++ workload on Windows, or Python, make, GCC, and G++ on Linux.

```bash
npm ci
npm run test:terminal
npm run dev
```

`npm ci` runs `electron-builder install-app-deps`, rebuilding `node-pty` for Electron's ABI. The
smoke test uses Electron's embedded Node runtime, starts a PTY, and verifies bidirectional data.

## Production builds

```bash
npm run build
npm run dist:mac
npm run dist:win
npm run dist:linux:appimage
```

Electron Builder rebuilds native dependencies for each target architecture and unpacks `node-pty`
from ASAR. Release validation should launch every packaged target and repeat the PTY smoke check;
cross-platform artifacts cannot be fully validated from one host OS.

## Verification checklist

- Create a session, write a deterministic command, receive its output, resize it, and kill it.
- Send Ctrl+C, Ctrl+D, Ctrl+Z, Tab, Backspace, arrows, Alt/Option, and function-key sequences through
  the API and verify the PTY receives them unchanged.
- Run `vim`, `less`, `top`, `tmux`, `ssh`, and `fzf` through an approved client.
- Produce sustained output and verify chunks are delivered directly to the event subscriber.
- Reload, crash, or close the owner and confirm no child shell remains.
- Verify commands installed through Homebrew, nvm, pnpm, Bun, Cargo, pyenv, and rbenv are found on
  macOS when they are available in the normal login shell.
- Verify an extension view and a second window cannot control another owner's PTY.
- Verify packaged macOS, Windows, and Linux applications load the unpacked native module.

## Current scope

The main Friday renderer currently has no terminal UI. Extension views cannot consume
this layer only through `@friday/sdk`. Tabs, split panes, display serialization, and SSH backends are
not part of the current scope. PTYs live in the Electron main process and end when their owner
reloads, closes, crashes, or the application quits.
