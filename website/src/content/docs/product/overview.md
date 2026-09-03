---
title: "What Kucedr Is"
description: "Kucedr is a cross-platform Electron desktop assistant that turns chat requests into tool calls, file and process work, web research, and generated media."
category: "Product"
sourcePath: "overview.md"
order: 0
---

Kucedr is a cross-platform Electron desktop app for Windows, macOS, and Linux. It puts a personal AI assistant on your computer so you can ask for work in plain language and get a concrete result: an answer with sources, an edited file, a generated image, a transcribed recording, a browser task carried out on a real page.

Unlike a website chatbot, Kucedr runs as an app on your machine. You bring your own AI provider keys, your settings and credentials stay in local application data, and sensitive actions pass through explicit permission checks.

## Who Kucedr Is For

- People who want a personal AI assistant that lives on the desktop instead of a browser tab.
- Professionals and power users who want the assistant to manage files, draft documents, run commands, and use connected tools.
- Privacy-minded users who prefer their own AI provider accounts and local data.
- Tinkerers and teams who want custom skills, MCP servers, and messaging integrations.

## Key Ideas

- **Chat that acts.** Kucedr runs a tool loop to complete work, not only describe it.
- **Bring your own AI.** Choose a provider and model independently for chat, transcription, speech, image, video, audio, scheduled work, and health checks.
- **Local first.** Settings, credentials, history, memory, projects, and generated media live in your application-data folder.
- **Permissioned.** Every tool carries its own policy; file edits, shell commands, and patches ask before they run.
- **Extensible.** Add local skills and connect remote HTTP or local stdio MCP servers.
- **Background work.** A `HEALTH.md` checklist runs on an interval and reports only when something needs attention.

## Request Flow

1. You make a request in chat, typed, dictated, or with images and PDFs attached.
2. Kucedr builds the turn's system prompt from the base assistant contract, tool descriptions, your workspace profile files, saved memory, the active project's instructions, and any skill loaded during the run.
3. It streams a model turn and collects text, reasoning continuity where the provider supports it, and tool calls.
4. Gated tool calls pause on a permission card. Approved calls run and stream their activity into the conversation.
5. The loop continues until the model stops requesting tools, you cancel, an error occurs, or the run reaches its twenty-turn limit.
6. Durable facts can be saved to memory for later conversations.

Each model turn currently allows up to 8,192 output tokens and is retried once after a provider failure.

## Feature Status Vocabulary

These docs use the same status words as Kucedr's internal feature reference, so a visible setting is never mistaken for a finished capability.

| Status | Meaning |
| --- | --- |
| Available | The renderer and main process are connected to a working implementation. Provider credentials or OS permissions may still be required. |
| Partial | A useful portion works, but an important control or execution path is missing. |
| Placeholder | A control or surface exists, but its intended workflow is not connected. |
| Catalog only | A provider or model is selectable, but no working execution adapter exists. |
