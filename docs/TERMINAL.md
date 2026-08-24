# Terminal Architecture

Friday's terminal workbench is available at `/terminal`. Stage 1 provides one local interactive
shell backed by a real operating-system pseudoterminal.

## Data flow

```text
xterm.js input -> terminalAPI -> validated Electron IPC -> PtyManager -> node-pty
node-pty output -> owner-only Electron IPC -> xterm.js write
ResizeObserver -> FitAddon -> terminalAPI -> node-pty resize
```

`node-pty` runs only in the Electron main process. The sandboxed renderer receives a narrow typed
API from the context-isolated preload and cannot choose an executable or access Node.js modules.
Every terminal belongs to the `webContents` that created it. Other windows, extension views, and
subframes cannot write, resize, or kill that session.

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

## Stage 1 verification checklist

- Run commands and verify ANSI, 256-color, true-color, Unicode, and emoji output.
- Exercise Ctrl+C, Ctrl+D, Ctrl+Z, Tab, Backspace, arrows, Home/End, Page Up/Down, Alt/Option, and
  function keys.
- Run `vim` or `nvim`, `less`, `top` or `htop`, `tmux`, `ssh`, `fzf`, Python, Node, and Git.
- Resize the window while a full-screen application is active.
- Produce sustained output and confirm the React component does not rerender for each chunk.
- Reload and close the window, then confirm no child shell remains.
- Verify commands installed through Homebrew, nvm, pnpm, Bun, Cargo, pyenv, and rbenv are found on
  macOS when they are available in the normal login shell.
- Verify an extension view and a second window cannot control another window's PTY.
- Verify packaged macOS, Windows, and Linux applications load the unpacked native module.

## Current scope

Tabs, split panes, search, link handling, native copy/paste menus, profiles, settings, themes,
serialization, and SSH backends are Stage 2–6 work. Terminal display serialization will not be
treated as restoration of a running process. PTYs currently live in the Electron process and end
when their owner reloads, closes, crashes, or the application quits.
