---
title: "Getting Started"
description: "Walk through first-run setup, add provider keys, choose models per capability, and know what to expect on each platform."
category: "Product"
sourcePath: "getting-started.md"
order: 70
---

## First Run

The first launch walks through three steps:

1. **Welcome** introduces Kucedr as a personal agent for everyday tasks, coding, and background work.
2. **Providers** requires at least one provider API key. Each card links to that vendor's key or configuration page and supports connect, edit, cancel, and save.
3. **Models** selects models for Assistant, Voice, Transcription, Image, Video, and Audio. Only the Assistant selection is required to finish.

Once an Assistant provider and model are stored, Kucedr skips setup on later launches and opens straight into chat. Everything chosen here can be changed later in Settings, and the provider and model for scheduled work and health checks are configured separately on their own Settings pages.

## After Setup

1. Start chatting, and approve any permission prompt for actions that touch files, commands, or outside services.
2. Attach images or PDFs, or dictate instead of typing.
3. Configure speech-to-text, text-to-speech, and image, video, and audio generation if you want them.
4. Extend Kucedr by importing skills, adding MCP servers, or connecting a Telegram or Discord bot.

## Finding Your Way Around

Settings groups its pages as **General** (Application, System, Providers), **Primary** (Assistant, Skills, MCP, Library, Tasks, with Health nested under Assistant), **Model services** (Transcribe, Voice, Image, Video, Audio), **Channels**, **Widgets**, **Cloud** (Storage, Database), and **Search**.

- `Cmd/Ctrl+F` opens a route and setting search palette.
- `Cmd/Ctrl+/` focuses the prompt editor.
- Deep pages use breadcrumbs, unknown routes show a recovery view, and page transitions respect your reduced-motion preference.

The Search settings page configures the same Brave or Tavily engine and key the agent's web-search tool uses. It is not a separate local-search feature.

## Application Preferences

View the app name and version, toggle the tray or menu-bar icon, keep the computer awake while still letting the display sleep, open the application-data folder, pick English or Italian, and choose a light, dark, or system theme. System mode follows OS theme changes.

## Media Permissions

System pages cover Microphone, Camera, and Screen capture. On macOS, Kucedr shows permission status, can request access, and opens the relevant System Settings pane; microphone recording, camera preview, and screen capture can each be tested and played back.

On other platforms the explicit system permission status reports as unknown, and the application-level microphone and camera toggles do not currently disable capture. Display capture automatically picks the first source Electron returns, so there is no source picker.

## Platforms And Languages

| Platform | Packaging |
| --- | --- |
| Windows | NSIS installer for x64, selectable install directory, desktop shortcut, app data retained on uninstall. |
| macOS | PKG and DMG for x64 and arm64, dark-mode support, hardened runtime, microphone and camera entitlements. |
| Linux | AppImage and DEB. |

The interface ships English and Italian catalogs with a locale selector, and light, dark, and system themes. Localization is partial: major first-run and home-screen copy, including the prompt suggestions and editor placeholder, is still hardcoded in English.
