import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

jest.mock('../../../../../src/main/shared/user_data_location', () => {
	const directory = jest.requireActual<typeof fs>('node:fs').mkdtempSync(jest.requireActual<typeof path>('node:path').join(jest.requireActual<typeof os>('node:os').tmpdir(), 'kucedr-workspace-'));
	return { userDataLocation: () => directory };
});

import { agentLocation } from '../../../../../src/main/shared/agent_location';
import { userDataLocation } from '../../../../../src/main/shared/user_data_location';
import { runToolCall } from '../../../../../src/main/agent/runner/run_tool_call';
import { writeTool } from '../../../../../src/main/agent/tools/core/write';
import { editTool } from '../../../../../src/main/agent/tools/core/edit';
import { readTool } from '../../../../../src/main/agent/tools/core/read';
import { applyPatchTool } from '../../../../../src/main/agent/tools/core/patch';
import { undoFileTool } from '../../../../../src/main/agent/tools/core/undo';
import { redoFileTool } from '../../../../../src/main/agent/tools/core/redo';
import { jsonTool } from '../../../../../src/main/agent/tools/tool';
import { processTool, registry, type ProcessSession } from '../../../../../src/main/agent/tools/core/process';
import { resetPermissions, setPermissions, getPermissions } from '../../../../../src/main/agent/agent_store';
import type { FileHistory } from '../../../../../src/main/agent/history/types';
import type { RuntimeEvent, Tool } from '../../../../../src/main/agent/types';

const workspace = agentLocation();
const scope = { ownerId: 'workspace-test', source: 'interactive', sessionId: 'workspace-test', runId: 'workspace-test' } as const;

async function execute(tool: Tool, args: Record<string, unknown>, history?: FileHistory, source?: 'task' | 'health' | 'child'): Promise<RuntimeEvent[]> {
	const events: RuntimeEvent[] = [];
	const security = source ? { runId: scope.runId, scope: { ...scope, source } } : { runId: scope.runId, windowId: 1, scope };
	for await (const event of runToolCall(tool, { id: crypto.randomUUID(), name: tool.id, args }, undefined, undefined, security, undefined, history)) {
		events.push(event);
		if (event.type === 'tool_permission_request') break;
	}
	return events;
}

beforeEach(() => {
	fs.mkdirSync(workspace, { recursive: true });
	resetPermissions();
});

afterAll(() => fs.rmSync(userDataLocation(), { recursive: true, force: true }));

it.each([undefined, 'task', 'health', 'child'] as const)('creates, reads, overwrites, edits, moves, deletes, undoes and redoes workspace files without approval (source: %s)', async (source) => {
	const history: FileHistory = { operations: [] };
	const operations: [Tool, Record<string, unknown>][] = [
		[writeTool, { path: 'tools/example.txt', content: 'first' }],
		[readTool, { path: 'tools/example.txt' }],
		[writeTool, { path: 'tools/example.txt', content: 'second' }],
		[editTool, { path: 'tools/example.txt', oldText: 'second', newText: 'third' }],
		[applyPatchTool, { input: '*** Begin Patch\n*** Update File: tools/example.txt\n*** Move to: tools/moved.txt\n@@\n-third\n+fourth\n*** End Patch' }],
		[applyPatchTool, { input: '*** Begin Patch\n*** Delete File: tools/moved.txt\n*** End Patch' }],
		[undoFileTool(history), {}],
		[redoFileTool(history), {}],
	];
	for (const [tool, args] of operations) {
		expect((await execute(tool, args, history, source)).at(-1)).toMatchObject({ type: 'tool_call_end', permissionOutcome: 'allow', isError: undefined });
	}
	expect(fs.existsSync(path.join(workspace, 'tools/example.txt'))).toBe(false);
	expect(fs.existsSync(path.join(workspace, 'tools/moved.txt'))).toBe(false);
	expect(history.operations).toHaveLength(5);
});

it.each(['task', 'health', 'child'] as const)('allows workspace commands and memory updates without a window for %s', async (source) => {
	for (const id of ['bash', 'save_memory', 'forget_memory', 'update_health']) {
		const run = jest.fn().mockResolvedValue('done');
		const tool = jsonTool({ id, name: id, description: id, schema: {}, execute: run });
		expect((await execute(tool, id === 'bash' ? { command: 'node tools/example.js' } : {}, undefined, source)).at(-1)).toMatchObject({ type: 'tool_call_end', permissionOutcome: 'allow' });
		expect(run).toHaveBeenCalled();
	}
});

it.each(['task', 'health', 'child'] as const)('blocks unapproved outside access without a window for %s', async (source) => {
	const run = jest.fn();
	const bash = jsonTool({ id: 'bash', name: 'bash', description: 'bash', schema: {}, execute: run });
	const operations: [Tool, Record<string, unknown>][] = [
		[writeTool, { path: '../background-outside.txt', content: 'outside' }],
		[bash, { command: 'pwd', workdir: '..' }],
		[bash, { command: 'pwd', additionalRoots: ['..'] }],
		[bash, { command: 'pwd', elevated: true }],
	];
	for (const [tool, args] of operations) {
		expect((await execute(tool, args, undefined, source)).at(-1)).toMatchObject({ type: 'tool_call_end', permissionOutcome: 'deny', isError: true });
	}
	expect(run).not.toHaveBeenCalled();
	expect(fs.existsSync(path.resolve(workspace, '../background-outside.txt'))).toBe(false);
});

it.each(['save_memory', 'forget_memory', 'update_health', 'bash'])('allows workspace %s without approval', async (id) => {
	const run = jest.fn().mockResolvedValue('done');
	const tool = jsonTool({ id, name: id, description: id, schema: {}, execute: run });
	expect((await execute(tool, id === 'bash' ? { command: 'node tools/example.js' } : {})).at(-1)).toMatchObject({ type: 'tool_call_end', permissionOutcome: 'allow' });
	expect(run).toHaveBeenCalled();
});

it('allows overwriting workspace names beginning with two dots', async () => {
	fs.mkdirSync(path.join(workspace, '..cache'));
	fs.writeFileSync(path.join(workspace, '..cache/file.txt'), 'old');
	expect((await execute(writeTool, { path: '..cache/file.txt', content: 'new' })).at(-1)).toMatchObject({ type: 'tool_call_end', permissionOutcome: 'allow' });
	expect(fs.readFileSync(path.join(workspace, '..cache/file.txt'), 'utf8')).toBe('new');
});

it.each(([undefined, 'task', 'health', 'child'] as const).flatMap((source) => ['kill', 'clear', 'remove'].map((action) => [action, source] as const)))('allows %s for an owned workspace sandbox process (source: %s)', async (action, source) => {
	const session = { id: action, scope: source ? { ...scope, source } : scope, workdir: workspace, roots: [workspace], executionMode: 'sandbox' } as ProcessSession;
	registry.register(session);
	try {
		const run = jest.fn().mockResolvedValue('done');
		expect((await execute({ ...processTool, run }, { action, sessionId: session.id }, undefined, source)).at(-1)).toMatchObject({ type: 'tool_call_end', permissionOutcome: 'allow' });
		expect(run).toHaveBeenCalled();
	} finally {
		registry.remove(session.id);
	}
});

it.each(['../outside.txt', '../workspace-copy/outside.txt'])('asks before writing %s outside the workspace', async (target) => {
	expect((await execute(writeTool, { path: target, content: 'outside' })).at(-1)).toMatchObject({ type: 'tool_permission_request', reason: 'outside_trusted_location' });
	expect(fs.existsSync(path.resolve(workspace, target))).toBe(false);
});

it('asks before following a workspace symlink to an outside file', async () => {
	const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-outside-'));
	try {
		fs.symlinkSync(outside, path.join(workspace, 'linked'), 'junction');
		expect((await execute(writeTool, { path: 'linked/file.txt', content: 'outside' })).at(-1)).toMatchObject({ type: 'tool_permission_request' });
		expect(fs.existsSync(path.join(outside, 'file.txt'))).toBe(false);
	} finally {
		fs.rmSync(outside, { recursive: true, force: true });
	}
});

it('asks before a patch moves a workspace file outside', async () => {
	fs.writeFileSync(path.join(workspace, 'move.txt'), 'content');
	expect((await execute(applyPatchTool, { input: '*** Begin Patch\n*** Update File: move.txt\n*** Move to: ../outside.txt\n@@\n-content\n+updated\n*** End Patch' })).at(-1)).toMatchObject({ type: 'tool_permission_request' });
	expect(fs.readFileSync(path.join(workspace, 'move.txt'), 'utf8')).toBe('content');
});

it.each([{ command: 'pwd', workdir: '..' }, { command: 'pwd', additionalRoots: ['..'] }, { command: 'pwd', elevated: true }])('asks before command access beyond the workspace: %j', async (args) => {
	const run = jest.fn();
	const tool = jsonTool({ id: 'bash', name: 'bash', description: 'bash', schema: {}, execute: run });
	expect((await execute(tool, args)).at(-1)).toMatchObject({ type: 'tool_permission_request' });
	expect(run).not.toHaveBeenCalled();
});

it('keeps explicit workspace deny rules effective', async () => {
	const permissions = getPermissions();
	setPermissions({ ...permissions, write: { ...permissions.write, deny: [path.join(workspace, 'blocked.txt')] } });
	expect((await execute(writeTool, { path: 'blocked.txt', content: 'blocked' })).at(-1)).toMatchObject({ type: 'tool_call_end', permissionOutcome: 'deny' });
	expect(fs.existsSync(path.join(workspace, 'blocked.txt'))).toBe(false);
});

it.each(['camera_recorder', 'microphone_recorder', 'screen_recorder', 'open_apps', 'create_task'])('retains approval for %s effects beyond workspace files', async (id) => {
	const run = jest.fn();
	const tool = jsonTool({ id, name: id, description: id, schema: {}, execute: run });
	expect((await execute(tool, {})).at(-1)).toMatchObject({ type: 'tool_permission_request' });
	expect(run).not.toHaveBeenCalled();
});
