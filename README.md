<p align="center">
  <img src="resources/icons/icon-rounded.png" alt="Friday logo" width="144" />
</p>

<h1 align="center">Friday</h1>

<p align="center">
  <strong>Your desktop AI copilot for everyday tasks.</strong>
</p>

Friday is a cross-platform desktop AI assistant that turns conversations into actions. Type or speak a request, attach images or PDFs, and let the agent work with files, run commands, research the web, create media, or automate a recurring task.

You choose the providers and models behind each AI capability. Friday keeps its settings, provider keys, conversations, and workspace data on your machine, while requests are sent only to the AI providers and connected services you configure.

## What Friday Can Do

- **Work with your computer** — read, create, and edit files; apply precise patches; and run commands or long-lived processes.
- **Use a real local terminal** — open an interactive PTY-backed shell with xterm.js rendering and native terminal behavior.
- **Understand more than text** — accept image and PDF attachments, transcribe speech, and read responses aloud.
- **Research and browse** — search the web, fetch pages, and automate browser interactions when a task requires them.
- **Create media** — generate images, videos, music, and sound effects with your selected providers and models.
- **Use your preferred AI providers** — configure your own API keys and select models separately for chat, speech, image, video, and audio.
- **Extend the agent** — import reusable skills, connect remote HTTP or local stdio MCP servers, and delegate independent work to subagents.
- **Automate routines** — create recurring schedules and periodic checklist-based health runs.
- **Remember useful context** — maintain durable memory, personalization files, conversation history, and a local working directory.
- **Compile persistent knowledge** — archive immutable evidence, incrementally maintain a cited Markdown wiki, query it before raw sources, and review risky changes.
- **Chat from other apps** — connect Telegram or Discord channels to reach Friday away from the desktop app.

Friday runs on Windows, macOS, and Linux, with English and Italian interfaces and light, dark, and system themes.

## Control and Privacy

- Provider API keys and Friday's application data are stored locally.
- Prompts, attachments, and tool data may be sent to the providers, MCP servers, websites, or messaging channels you configure.
- File writes, edits, patches, and command execution are governed by the agent permission policy.
- Tool activity is streamed into the conversation so you can follow what the agent is doing.
- Friday does not claim formal certification for regulated data.

## Technology

- Electron 41 and Node.js
- React 19, TypeScript, Tailwind CSS 4, and shadcn components
- xterm.js and node-pty for the local terminal workbench
- Jest, Testing Library, and Playwright
- electron-vite and electron-builder

## Getting Started

Requirements: Node.js 22.14+ and npm 11.5.1+.

```bash
npm ci
npm run dev
```

The root install includes the Electron app, `@friday/sdk`, and `@friday/cli` through npm
workspaces and one lockfile.

On first launch, add an API key under **Settings → Providers**, then select the provider and model for the assistant. Configure speech and media models only for the capabilities you plan to use.

For Linux environments that require Electron sandbox changes, run:

```bash
npm run dev-linux
```

### Command-line interface

The TypeScript CLI lives in `packages/cli`. It launches the desktop app, installs validated Friday
plugins, and includes an interactive terminal interface:

```bash
npm run cli:build
npm link ./packages/cli

friday
friday install package-one
friday tui
```

Inside the TUI, enter `/install package-one`. See
[`packages/cli/README.md`](packages/cli/README.md) for the command and plugin-install contracts.

## Quality Checks

Run the main local checks before submitting changes:

```bash
npm run quality:check
```

This runs the TypeScript checks, ESLint, main-process tests, and renderer tests. Run the end-to-end suite separately:

```bash
npm run test:e2e
```

## Build and Package

```bash
npm run build                # Type-check and create a production build
npm run dist:win             # Windows x64 installer and portable executable
npm run dist:win:portable    # Windows x64 portable executable only
npm run dist:mac             # macOS package for x64 and arm64
npm run dist:mac:dmg         # macOS DMG for x64 and arm64
npm run dist:linux:appimage  # Linux AppImage
npm run dist:linux:portable  # Linux AppImage and tar.gz archive
```

### Portable releases

On Windows, download `Friday-Portable-<version>-x64.exe` and run it directly. It temporarily
extracts its signed application files while Friday is running, but does not install shortcuts,
file associations, or uninstall records and does not require administrator access.

On Linux, download the AppImage, mark it executable, and launch it. If AppImage mounting or FUSE
is unavailable, extract the `.tar.gz` release and run `friday-desktop` from the extracted folder.
Neither option requires a package installation.

Friday settings, conversations, workspace files, and generated data remain under
`%USERPROFILE%\.friday` on Windows or `$HOME/.friday` on Linux. Electron runtime data remains in
`%APPDATA%\Friday` on Windows or `$XDG_CONFIG_HOME/Friday` on Linux, normally
`$HOME/.config/Friday`. Portable updates are manual: close Friday and replace the executable or
extracted application; the profile data remains in place.

Portable packaging does not bypass AppLocker, WDAC, Linux `noexec`, endpoint security, or network
policy. Protected command execution may require administrator or IT setup, and browser automation
requires an installed, permitted Google Chrome. Friday reports these limitations without preventing
chat and other supported features from running.

## Project Structure

- `src/main` contains the Electron main process, agent runtime, channels, model integrations, media services, transcription, IPC, and application services.
- `src/renderer/src` contains the React user interface.
- `src/preload` exposes the narrow bridge between the renderer and main process.
- `src/shared` contains cross-process types and API contracts.
- `src/main/terminal` and `src/renderer/src/pages/terminal` contain the PTY lifecycle and terminal workbench. See [Terminal Architecture](docs/TERMINAL.md).
- `packages/cli` contains the publishable TypeScript command-line and terminal interface.
- `packages/sdk` contains the publishable typed client for Friday's local API.
- `src/main/agent` contains sessions, tools, skills, memory, schedules, health runs, sandboxing, and permission policy.
- `src/main/models` contains provider-specific model integrations. See
  [Provider Reference](docs/PROVIDERS.md) for the built-in catalog and runtime support matrix.
- `src/main/agent/knowledge/wiki` contains immutable-source registration, transactional wiki compilation, retrieval, lint, review, and agent tools. See [LLM Wiki](docs/WIKI.md).

## Security

Renderer windows use sandboxing, context isolation, disabled Node integration, and web security. Preload APIs expose narrow typed IPC methods, and agent writes, edits, patches, and command execution are subject to the permission policy.

See [SECURITY.md](SECURITY.md) for the security policy and vulnerability reporting process.

## Releases

The Electron app, SDK, and CLI are versioned and deployed independently from this repository.
See [Development, Testing, and Deployment](docs/DEVELOPMENT.md) for local setup, test
commands, normal pushes, tag conventions, npm trusted publishing, desktop signing, and
recovery procedures.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, workflow, and code standards. Behavioral guidelines for AI-assisted contributions are in [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE) © 2026 Harald Bregu
