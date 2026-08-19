# @friday/sdk

Typed client for app-data access in Friday.

This package exposes typed Friday APIs for in-app code and the accompanying remote client
used to call supported APIs over Friday's local HTTP bridge.

## Install

```sh
npm install @friday/sdk
```

## Usage from another app

Friday writes a bearer token to `<userData>/sdk-token` (for example:
`~/Library/Application Support/Friday/sdk-token` on macOS).
Read that token and call `connect()` to reach Friday over HTTP.

```ts
import { readFileSync } from 'node:fs';
import { connect } from '@friday/sdk';

const friday = connect({
	token: readFileSync('/Users/me/Library/Application Support/Friday/sdk-token', 'utf8').trim(),
});

await friday.ping(); // { name: 'friday', version: '1.0.0' }

const theme = await friday.app.getThemeData();
await friday.app.setTheme('dark');

const workspace = await friday.agent.getWorkspaceLocation();
const files = await friday.agent.listWorkspaceFiles();
const content = await friday.agent.readWorkspaceFile('USER.md');
await friday.agent.writeWorkspaceMarkdown('USER.md', '# Updated');
await friday.agent.createWorkspaceFile('', 'draft.md');
await friday.agent.createWorkspaceDirectory('notes', 'ideas');
await friday.agent.moveWorkspaceEntry('draft.md', 'notes');
await friday.agent.renameWorkspaceEntry('notes/draft.md', 'idea.md');
await friday.agent.deleteWorkspaceFile('old.md');
await friday.agent.deleteWorkspaceDirectory('archive');
```

File entries returned by `listWorkspaceFiles()` include their byte size and ISO creation and
update timestamps. Directory entries contain their recursive `children` instead.

Streaming callbacks (for `app` events) use the SSE stream opened on first use; call
`friday.close()` when finished.

## Usage inside Friday

```ts
import { agent, app, isFriday, win, type AppThemeData } from '@friday/sdk';

if (!isFriday()) throw new Error('Not running inside Friday');

const themeData: AppThemeData = await app.getThemeData();
await app.setTheme(themeData.themeMode === 'dark' ? 'light' : 'dark');

await app.setExtensionStoreValue('config', { color: 'blue', autosave: true });
const config = await app.getExtensionStoreValue<{ color: string; autosave: boolean }>('config');

const encoded = new TextEncoder().encode('extension-owned file');
await app.writeExtensionStoreFile('notes/example.txt', encoded);
const decoded = new TextDecoder().decode(await app.readExtensionStoreFile('notes/example.txt'));

const workspace = await agent.getWorkspaceLocation();
const files = await agent.listWorkspaceFiles();
const content = await agent.readWorkspaceFile('USER.md');
const image = await agent.readWorkspaceAsset('images/photo.png');
await agent.writeWorkspaceMarkdown('USER.md', '# Updated');
await agent.createWorkspaceFile('', 'draft.md');
await agent.createWorkspaceDirectory('notes', 'ideas');
await agent.moveWorkspaceEntry('draft.md', 'notes');
await agent.renameWorkspaceEntry('notes/draft.md', 'idea.md');
await agent.deleteWorkspaceFile('old.md');
await agent.deleteWorkspaceDirectory('archive');
const action = await win.showContextMenu([
	{ type: 'role', role: 'copy' },
	{ type: 'separator' },
	{ id: 'open', label: 'Open' },
	{ id: 'copy-path', label: 'Copy Path' },
]);
win.maximize();
const maximized = await win.isMaximized();
```

## What's available

- `app`: app data + settings APIs exposed by preload (`setTheme`, `getThemeData`, `getLanguage`, etc.)
- `agent`: workspace APIs exposed by preload, including text reads, typed asset reads, and Markdown writes.
- `win`: embedded-only window APIs, including native context menus and window controls.
- `connect()`: remote client for the app API and workspace agent APIs.
- `isFriday()`: host check for in-app mode.
- `ping()`: validate API reachability in remote mode.

Extension store methods are available only to extensions embedded in Friday. Friday derives the
extension namespace from the calling view, so extensions never pass or select an extension ID.
Values are JSON state stored in plaintext and should not contain passwords or API keys. File paths
are relative to the extension's isolated files directory, and file data uses `Uint8Array`.

Value keys must be non-empty strings; prototype-related and internal keys are reserved. A missing
value returns `undefined`. Values must contain only finite numbers, strings, booleans, null, dense
arrays, and plain objects. The generic parameter on `getExtensionStoreValue()` is a TypeScript
assertion, not runtime schema validation; `isExtensionStoreValue()` validates only this JSON-safe
shape.

File paths use forward slashes and cannot be absolute, empty, or contain `.` / `..` segments. Writes
atomically replace an existing file, missing-file reads reject, and both delete methods are
idempotent. Stored data is retained when an extension is removed, so reinstalling the same
extension ID restores its state.

## Development

Run these commands from the repository root:

```sh
npm ci
npm run sdk:build
npm run sdk:test
```

## Publishing

SDK releases use `sdk-v<version>` tags and npm trusted publishing. See the repository
[development and deployment guide](../../docs/DEVELOPMENT.md#release-the-sdk).
