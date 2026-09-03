---
title: "Feature Overview"
description: "The main Kucedr capabilities: chat, the agent tool set, voice, media generation, projects, memory, widgets, and cloud backup."
category: "Product"
sourcePath: "features.md"
order: 10
---

Kucedr is built around a conversational assistant that takes actions through tools.

## Assistant Chat

Assistant output streams into the conversation as GitHub-flavored Markdown: headings, lists, tables, blockquotes, inline code, and syntax-highlighted code blocks. External links open outside the app.

- Tool calls are grouped into collapsible activity summaries showing running, completed, or error state, input, output, duration, and the tool-call identifier.
- Generated images, video, and audio appear inline and play without leaving the conversation. Right-click opens a native menu to open, reveal, copy, or save a copy.
- Copy, read-aloud, and reply actions sit on each assistant message.
- Multiple images and PDFs can be attached to one request. Attachment chips show filename and size and can be removed before sending. Kucedr sets no attachment-size limit of its own; provider limits still apply.
- Typing `/` opens a command menu for `/skill`, `/goal`, `/task_list`, `/create_task`, and `/delete_task`.
- `Cmd/Ctrl+/` focuses the prompt editor. The send button becomes a stop button during a run, and stopping aborts the run and rejects any pending tool approval.

Sessions are stored locally, listed newest first, and titled from the first user message. Switching sessions restores its stored transcript; the chat view loads at most the last fifty stored messages. Settings includes a Chat History screen with per-session deletion.

## Agent Tools

| Area | What it does |
| --- | --- |
| Files | Read a complete UTF-8 file, create or overwrite a text file, replace one exact unique match, and apply structured multi-file patches. |
| Commands | Run a shell command with working directory, environment, timeout, background behavior, and optional PTY. |
| Processes | List, poll, page through logs, write or paste text, send special keys, kill, clear, or remove retained long-running sessions. |
| Web search | Query Brave or Tavily for 1–20 results using the key from Settings. |
| Web fetch | Fetch public HTTP(S) pages or JSON, follow up to three redirects, convert HTML to text, and truncate long output. Private, loopback, and link-local targets are blocked. |
| Browser | Start or stop a persistent visible Chrome profile; manage tabs; navigate; take DOM, text, screenshot, or PDF snapshots; read console output; click, type, hover, drag, select, fill, wait, or evaluate. |
| Media | Generate an image, video, music track, or sound effect and save it to the media library. |
| Memory | Save a durable fact, or forget every saved fact containing a case-insensitive match. |
| Projects | Create, list, select, update, delete, or unload a named workspace. |
| Skills | Load an enabled skill's `SKILL.md` and return its directory path to the run. |
| MCP | Load enabled server tools dynamically as `mcp__<server>__<tool>`. |
| Schedules | Create, update, pause, resume, delete, inspect, list, or trigger schedule records. |
| Health | Replace the `HEALTH.md` checklist or update health-run settings. |
| Subagents | Run one independent subagent with a fresh conversation and the same tools, minus further subagent spawning. |

Subagents are non-interactive: any tool that resolves to *ask* is denied, because a subagent cannot show you a permission card.

Host elevation, gateway execution, and remote-node execution are not implemented in this runtime.

## Voice

**Available.** With a streaming speech-to-text model, Kucedr captures mono PCM audio and appends partial and final transcript events live. With a batch-only model it records locally, submits when you stop, and appends the returned transcript. Dictation includes microphone permission checks, elapsed time, mute, confirm, cancel, and error states. Assistant replies can be read aloud through the configured text-to-speech provider.

**Placeholder.** The voice-conversation control on an empty editor opens an animated panel only. It does not start a realtime model, a microphone-to-agent loop, or an automatic spoken-response loop.

## Image, Video, And Audio Generation

Describe an image, video clip, music track, or sound effect and Kucedr creates it with the provider and model configured for that media type, either from the dedicated Settings studio or from an agent tool mid-conversation.

Agent-created media is saved under the app's local `library` folder and displayed inline in chat. The Library screen lists images, videos, and audio newest first with filename and creation date; it has no search, filter, refresh, or delete toolbar yet.

See [Providers](/docs/providers) for which media adapters actually execute.

## Projects

Projects are named, persistent workspaces stored as folders under the agent's `projects` directory, each with a `project.json` and its own `AGENTS.md`.

Selecting a project appends its `AGENTS.md` to the system prompt for that turn. It does **not** change the working directory, the execution policy, or which tools are available.

There is no Settings screen for projects; the feature is agent-tool only and driven entirely through conversation. Project tools also sit outside the centralized permission system, so only `delete_project` asks for confirmation.

## Memory And Personalization

Kucedr keeps a workspace of Markdown files in local application data:

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Standing behavior and workspace instructions. |
| `BOOTSTRAP.md` | One-time conversational setup for a fresh profile. |
| `IDENTITY.md` | Assistant identity and presentation. |
| `SOUL.md` | Personality and behavioral guidance. |
| `USER.md` | Your profile and preferences. |
| `MEMORY.md` | Durable facts loaded into every conversation. |
| `HEALTH.md` | Checklist used by periodic health runs. |

Saving a fact adds one bullet without duplicating an identical line; forgetting removes every bullet containing the requested text. Workspace and memory content is rebuilt into the system prompt before each model turn.

## Widgets

**Partial.** Widgets are standalone mini-app windows, each a folder with a `manifest.json` declaring title, description, and entry point. The main process watches widget folders and supports hot reload, and the application menu can open each widget in its own window. The Widgets settings page is view-only, with no install, remove, or enable control yet.

## Cloud Backup

The Storage settings page configures S3-compatible remote storage (endpoint, region, access key, secret key, bucket, path style, selected local paths, and a sync interval) so the folders you choose back up to a bucket on a schedule. This is folder backup, not device-to-device sync.

A Database entry appears in Settings navigation as "coming soon" with no page or backend behind it.
