import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
	agent,
	app,
	coder,
	connect,
	isExtensionStoreValue,
	isFriday,
	terminal,
	win,
} from './dist/packages/sdk/index.js';

// --- embedded mode: bound to the app's preload globals ----------------------

assert.equal(isFriday(), false);
assert.throws(() => app.getTheme, /unavailable/);
assert.throws(() => agent.getWorkspaceLocation, /unavailable/);
assert.throws(() => coder.getSettings, /unavailable/);
assert.throws(() => terminal.create, /unavailable/);
assert.throws(() => win.showContextMenu, /unavailable/);

const extensionValues = new Map();
const extensionFiles = new Map();
const workspaceFile = {
	name: 'USER.md',
	path: 'USER.md',
	type: 'file',
	size: 128,
	createdAt: '2026-08-17T10:00:00.000Z',
	updatedAt: '2026-08-18T10:00:00.000Z',
};
globalThis.app = {
	getExtensionStoreValue: async (key) => extensionValues.get(key),
	setExtensionStoreValue: async (key, value) => extensionValues.set(key, value),
	deleteExtensionStoreValue: async (key) => extensionValues.delete(key),
	readExtensionStoreFile: async (path) => {
		const data = extensionFiles.get(path);
		if (!data) throw new Error('Extension file not found.');
		return data;
	},
	writeExtensionStoreFile: async (path, data) => extensionFiles.set(path, new Uint8Array(data)),
	deleteExtensionStoreFile: async (path) => extensionFiles.delete(path),
	getThemeData: async () => ({
		themeMode: 'system',
		isDark: false,
		colors: { background: '#fff' },
	}),
	getTheme: async () => 'system',
	setTheme: async () => undefined,
	getLanguage: async () => 'en',
	setLanguage: async () => undefined,
	onThemeModeChanged: () => () => undefined,
};
globalThis.agent = {
	getWorkspaceLocation: async () => '/tmp/friday-workspace',
	listWorkspaceFiles: async () => [workspaceFile],
	readWorkspaceFile: async (filePath) => `content:${filePath}`,
	readWorkspaceAsset: async () => ({ mimeType: 'image/png', data: new Uint8Array([1, 2, 3]) }),
	writeWorkspaceMarkdown: async () => undefined,
	createWorkspaceFile: async (parentPath, name) => [parentPath, name].filter(Boolean).join('/'),
	createWorkspaceDirectory: async (parentPath, name) =>
		[parentPath, name].filter(Boolean).join('/'),
	moveWorkspaceEntry: async (sourcePath, destinationDirectoryPath) =>
		[destinationDirectoryPath, sourcePath.split('/').pop()].filter(Boolean).join('/'),
	renameWorkspaceEntry: async (sourcePath, name) =>
		[...sourcePath.split('/').slice(0, -1), name].filter(Boolean).join('/'),
	deleteWorkspaceFile: async () => undefined,
	deleteWorkspaceDirectory: async () => undefined,
};
const coderSettings = {
	runtime: 'pi',
	providerId: 'openai-codex',
	modelId: 'gpt-5.4',
	thinkingLevel: 'high',
	toolMode: 'coding',
};
const coderProject = {
	id: 'project-1',
	name: 'friday-workspace',
	directory: '/tmp/friday-workspace',
	kind: 'agent-workspace',
	createdAt: '2026-08-20T10:00:00.000Z',
	lastOpenedAt: '2026-08-20T10:00:00.000Z',
	available: true,
};
const coderInstructions = {
	projectId: coderProject.id,
	activeFilePath: '/tmp/friday-workspace/AGENTS.md',
	activeFileName: 'AGENTS.md',
	content: '# Instructions',
	exists: true,
	editable: true,
	revision: 'revision-1',
	loadedSources: [{ path: '/tmp/friday-workspace/AGENTS.md', scope: 'workspace' }],
};
globalThis.coder = {
	getSettings: async () => coderSettings,
	saveSettings: async (settings) => settings,
	listModels: async () => ({ providers: [] }),
	listProjects: async () => [coderProject],
	addProject: async () => coderProject,
	openProject: async () => undefined,
	removeProject: async (projectId) => projectId === coderProject.id,
	getProjectInstructions: async () => coderInstructions,
	saveProjectInstructions: async (_projectId, update) => ({
		...coderInstructions,
		content: update.content,
		revision: 'revision-2',
	}),
	listSessions: async () => [],
	getSession: async () => ({
		session: {
			id: 'session-1',
			projectId: coderProject.id,
			title: 'Fix the tests',
			createdAt: '2026-08-20T10:00:00.000Z',
			updatedAt: '2026-08-20T10:00:00.000Z',
			messageCount: 2,
		},
		blocks: [],
	}),
	renameSession: async (projectId, sessionId, title) => ({
		id: sessionId,
		projectId,
		title,
		createdAt: '2026-08-20T10:00:00.000Z',
		updatedAt: '2026-08-20T10:00:00.000Z',
		messageCount: 2,
	}),
	deleteSession: async () => true,
	send: async (request, onEvent) => {
		const context = {
			runId: 'coder-run',
			projectId: request.projectId,
			sessionId: 'session-1',
		};
		onEvent?.({ ...context, type: 'status', status: 'started' });
		onEvent?.({ ...context, type: 'text-delta', delta: 'done' });
		return { projectId: request.projectId, sessionId: 'session-1', output: 'done' };
	},
	cancel: async (runId) => runId === 'coder-run',
	connectCodex: async () => ({ configured: true, type: 'oauth' }),
	cancelCodexLogin: async () => false,
	disconnectCodex: async () => undefined,
};
globalThis.terminalAPI = {
	create: async (request) => ({
		...request,
		shell: '/bin/zsh',
		cwd: request.cwd ?? '/tmp/friday-workspace',
		createdAt: 1,
	}),
	write: () => undefined,
	resize: () => undefined,
	kill: async () => true,
	onData: () => () => undefined,
	onExit: () => () => undefined,
};
globalThis.win = {
	minimize: () => undefined,
	maximize: () => undefined,
	close: () => undefined,
	popupMenu: () => undefined,
	showContextMenu: async (items) => items[0]?.id ?? null,
	isMaximized: async () => true,
	onMaximizeChange: () => () => undefined,
	isFullScreen: async () => false,
	onFullScreenChange: () => () => undefined,
};

assert.equal(isFriday(), true);
assert.equal(isExtensionStoreValue({ color: 'blue', sizes: [1, 2] }), true);
assert.equal(isExtensionStoreValue({ invalid: Number.NaN }), false);
assert.deepEqual(await app.getThemeData(), {
	themeMode: 'system',
	isDark: false,
	colors: { background: '#fff' },
});
await app.setExtensionStoreValue('config', { color: 'blue' });
assert.deepEqual(await app.getExtensionStoreValue('config'), { color: 'blue' });
await app.deleteExtensionStoreValue('config');
assert.equal(await app.getExtensionStoreValue('config'), undefined);
await app.writeExtensionStoreFile('assets/data.bin', new Uint8Array([4, 5, 6]));
assert.deepEqual(await app.readExtensionStoreFile('assets/data.bin'), new Uint8Array([4, 5, 6]));
await app.deleteExtensionStoreFile('assets/data.bin');
await assert.rejects(app.readExtensionStoreFile('assets/data.bin'), /not found/);
const writeExtensionStoreFile = globalThis.app.writeExtensionStoreFile;
delete globalThis.app.writeExtensionStoreFile;
assert.throws(
	() => app.writeExtensionStoreFile,
	/app\.writeExtensionStoreFile.*update the Friday host/
);
globalThis.app.writeExtensionStoreFile = writeExtensionStoreFile;
assert.equal(await agent.getWorkspaceLocation(), '/tmp/friday-workspace');
assert.deepEqual(await agent.listWorkspaceFiles(), [workspaceFile]);
assert.equal(await agent.readWorkspaceFile('USER.md'), 'content:USER.md');
assert.deepEqual(await agent.readWorkspaceAsset('photo.png'), {
	mimeType: 'image/png',
	data: new Uint8Array([1, 2, 3]),
});
await agent.writeWorkspaceMarkdown('USER.md', '# Updated');
assert.equal(await agent.createWorkspaceFile('', 'draft.md'), 'draft.md');
assert.equal(await agent.createWorkspaceDirectory('notes', 'ideas'), 'notes/ideas');
assert.equal(await agent.moveWorkspaceEntry('draft.md', 'notes'), 'notes/draft.md');
assert.equal(await agent.renameWorkspaceEntry('notes/draft.md', 'idea.md'), 'notes/idea.md');
await agent.deleteWorkspaceFile('old.md');
await agent.deleteWorkspaceDirectory('archive');
assert.deepEqual(await coder.getSettings(), coderSettings);
const coderEvents = [];
assert.deepEqual(await coder.listProjects(), [coderProject]);
assert.deepEqual(await coder.getProjectInstructions(coderProject.id), coderInstructions);
assert.equal(
	(
		await coder.saveProjectInstructions(coderProject.id, {
			content: '# Updated',
			expectedRevision: coderInstructions.revision,
		})
	).content,
	'# Updated'
);
assert.deepEqual(
	await coder.send({ projectId: coderProject.id, mode: 'agent', input: 'Fix the tests' }, (event) =>
		coderEvents.push(event)
	),
	{ projectId: coderProject.id, sessionId: 'session-1', output: 'done' }
);
assert.deepEqual(coderEvents, [
	{
		type: 'status',
		runId: 'coder-run',
		projectId: coderProject.id,
		sessionId: 'session-1',
		status: 'started',
	},
	{
		type: 'text-delta',
		runId: 'coder-run',
		projectId: coderProject.id,
		sessionId: 'session-1',
		delta: 'done',
	},
]);
assert.equal(await coder.cancel('coder-run'), true);
await coder.openProject(coderProject.id);
assert.equal(
	(await coder.renameSession(coderProject.id, 'session-1', 'Focused tests')).title,
	'Focused tests'
);
assert.equal(await coder.deleteSession(coderProject.id, 'session-1'), true);
assert.deepEqual(
	await terminal.create({
		id: 'terminal-coder',
		cwd: coderProject.directory,
		cols: 80,
		rows: 24,
	}),
	{
		id: 'terminal-coder',
		cwd: coderProject.directory,
		cols: 80,
		rows: 24,
		shell: '/bin/zsh',
		createdAt: 1,
	}
);
terminal.write({ id: 'terminal-coder', data: 'pwd\r' });
terminal.resize({ id: 'terminal-coder', cols: 120, rows: 40 });
assert.equal(await terminal.kill({ id: 'terminal-coder' }), true);
assert.equal(await win.showContextMenu([{ id: 'open', label: 'Open' }]), 'open');
assert.equal(await win.isMaximized(), true);

// --- remote mode: bound to the app API server --------------------------------

const calls = [];
let stream;

const server = createServer(async (req, res) => {
	assert.equal(req.headers.authorization, 'Bearer secret');
	if (req.url === '/health') {
		res.writeHead(200, { 'content-type': 'application/json' });
		res.end(JSON.stringify({ name: 'friday', version: '1.0.0' }));
		return;
	}
	if (req.url === '/events') {
		res.writeHead(200, { 'content-type': 'text/event-stream' });
		res.write(': connected\n\n');
		stream = res;
		return;
	}
	const chunks = [];
	for await (const chunk of req) chunks.push(chunk);
	const { channel, args } = JSON.parse(Buffer.concat(chunks).toString());
	calls.push({ channel, args });
	res.writeHead(200, { 'content-type': 'application/json' });
	res.end(
		JSON.stringify({
			success: true,
			data:
				channel === 'agent:workspace:location:get'
					? '/tmp/friday-workspace'
					: channel === 'agent:workspace:files:list'
						? [workspaceFile]
						: channel === 'agent:workspace:file:read'
							? `content:${args[0]}`
							: channel === 'agent:workspace:asset:read'
								? { mimeType: 'image/png', data: { $bytes: 'AQID' } }
								: (args[0] ?? null),
		})
	);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const friday = connect({ url: `http://127.0.0.1:${server.address().port}`, token: 'secret' });

assert.deepEqual(await friday.ping(), { name: 'friday', version: '1.0.0' });
assert.throws(() => friday.app.getExtensionStoreValue, /not available over the API/);
await friday.app.getThemeData();
assert.equal(await friday.agent.getWorkspaceLocation(), '/tmp/friday-workspace');
assert.deepEqual(await friday.agent.listWorkspaceFiles(), [workspaceFile]);
assert.equal(await friday.agent.readWorkspaceFile('USER.md'), 'content:USER.md');
assert.deepEqual(await friday.agent.readWorkspaceAsset('photo.png'), {
	mimeType: 'image/png',
	data: new Uint8Array([1, 2, 3]),
});
await friday.agent.writeWorkspaceMarkdown('USER.md', '# Updated');
await friday.agent.createWorkspaceFile('', 'draft.md');
await friday.agent.createWorkspaceDirectory('notes', 'ideas');
await friday.agent.moveWorkspaceEntry('draft.md', 'notes');
await friday.agent.renameWorkspaceEntry('notes/draft.md', 'idea.md');
await friday.agent.deleteWorkspaceFile('old.md');
await friday.agent.deleteWorkspaceDirectory('archive');

assert.deepEqual(
	calls.map((call) => call.channel),
	[
		'app:get-theme-data',
		'agent:workspace:location:get',
		'agent:workspace:files:list',
		'agent:workspace:file:read',
		'agent:workspace:asset:read',
		'agent:workspace:markdown:write',
		'agent:workspace:file:create',
		'agent:workspace:directory:create',
		'agent:workspace:entry:move',
		'agent:workspace:entry:rename',
		'agent:workspace:file:delete',
		'agent:workspace:directory:delete',
	]
);

// events reach subscribers over the stream
const seen = [];
friday.app.onChannelsStatusChanged((event) => seen.push(event));
await new Promise((resolve) => setTimeout(resolve, 100));
stream.write(
	`data: ${JSON.stringify({ channel: 'app:channels:status-changed', data: { ok: 1 } })}\n\n`
);
await new Promise((resolve) => setTimeout(resolve, 100));
assert.deepEqual(seen, [{ ok: 1 }]);

friday.close();
server.close();
stream?.end();

console.log('sdk smoke ok');
