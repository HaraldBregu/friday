---
title: "Privacy And Security"
description: "What Kucedr stores locally, when data leaves your machine, how the permission system resolves, and where the boundaries are."
category: "Privacy"
sourcePath: "privacy.md"
order: 60
---

Kucedr is designed to keep you in control of your data and actions. This page states the limits as plainly as the guarantees.

## Local By Default

Kucedr stores configuration and working data below Electron's application-data directory.

| Area | Stored data |
| --- | --- |
| App | Tray, keep-awake, language, and theme settings. |
| Providers | Provider name, API key, and base URL. |
| Agent | Active model, policy, MCP definitions and OAuth state, skills, projects, schedules, health settings, workspace Markdown, sessions, and the media library. |
| Channels | Bot tokens, sender policies, and channel reply model. |
| Services | Independent text, transcription, voice, image, video, and audio selections. |
| Media | Standalone generated video and audio files. |
| Browser | The persistent agent-browser profile. |
| Storage | S3-compatible remote-storage credentials and sync configuration. |
| Diagnostics | Local rotating logs and crash dumps. Crash dumps are not uploaded by the current configuration. |

## When Data Leaves Your Machine

Prompts, attachments, tool inputs, and generated content may be sent to configured model providers, MCP servers, websites, browser targets, Telegram, Discord, or your configured cloud-storage endpoint, as required by the operation you asked for, and to nowhere else.

## Bring Your Own Keys

You use your own provider accounts. Kucedr does not put another vendor between you and the providers you choose.

## How Credentials Are Stored

Secrets are masked in the interface after saving, but provider keys, bot tokens, and MCP secrets are kept in ordinary local `electron-store` files, not in an encrypted credential vault. **Anyone with access to your application-data folder may be able to read them.** Treat that folder as sensitive, and rely on your operating system's disk encryption and account separation.

## Explicit Permissions

Every tool owns a policy object with `default`, `allow`, `ask`, and `deny` fields.

- `read`, `write`, and `process` default to **Allow**. `edit`, `exec`, and `apply_patch` default to **Ask**. Other built-in tools default to Allow.
- The permission card offers **Deny**, **Allow once**, and **Always allow**.
- An always-allow decision stores the containing folder for `read`, the exact target for other file and patch tools, and the raw command for `exec`.
- A top-level `dir` map pre-authorizes directory-scoped tool lists, with `recoursive: true` covering descendants.
- The policy can be reset to defaults at any time.

Rules resolve in three layers: the built-in system policy for agent-owned resources, then directory pre-authorizations, then the named tool's own rules and default. The most specific matching path wins; equally specific rules resolve Deny, then Ask, then Allow. A rule for one tool never changes another tool's decision.

## Boundaries Worth Knowing

- `exec` policy examines the command string. It is a guardrail, not an operating-system sandbox, and cannot prove which paths a command will actually touch.
- Directory policy resolves `exec` from its working directory, but a command can still reach paths outside that directory.
- Relative policy paths such as `Desktop` resolve from your home directory.
- Project tools run outside the centralized policy system and always execute; only `delete_project` asks for confirmation.
- MCP tools are gated only by their own `require_approval` default, so review a server before enabling it.

## Hardened App Shell

Renderer windows use Electron sandboxing, context isolation, disabled Node integration, web security, and insecure-content blocking. Production navigation is restricted to local `file://` content, renderer capabilities are exposed through typed preload APIs rather than direct Node access, media permission requests are limited to trusted app windows and renderer origins, and native media context menus validate that files sit inside the agent or media data roots.

Provider secrets remain readable by trusted renderer code through the provider preload API.

## Certification Note

Kucedr does not claim formal regulated-data certification. Review your own AI providers' and connected services' terms for how they handle data you send them.
