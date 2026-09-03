import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { realPath } from '../../../../../src/main/shared/real_path';

const getPermissions = jest.fn();
const addPermissionRule = jest.fn();

jest.mock('../../../../../src/main/agent/agent_store', () => ({
	AGENT_DIRECTORY: '/appdata/agent',
	addPermissionRule,
	getPermissions,
}));

import { createRunContext } from '../../../../../src/main/agent/context';
import { respondToolPermission } from '../../../../../src/main/agent/permissions';
import { runToolCall } from '../../../../../src/main/agent/runner/run_tool_call';
import { jsonTool } from '../../../../../src/main/agent/tools/tool';
import { execTool } from '../../../../../src/main/agent/tools/core/bash';
import type { ExecSandbox } from '../../../../../src/main/agent/sandbox';
import type { RuntimeEvent, Tool, ToolCall } from '../../../../../src/main/agent/types';

const emptyPermissions = {
	read: { allow: [], deny: [] },
	write: { allow: [], deny: [] },
	exec: { allow: [], deny: [] },
};

beforeEach(() => {
	getPermissions.mockReset().mockReturnValue(emptyPermissions);
	addPermissionRule.mockReset();
});

describe('exec path approval', () => {
	it('runs shell syntax inside the workspace without an approval event', async () => {
		getPermissions.mockReturnValue({
			...emptyPermissions,
			exec: { allow: ['/appdata/agent/**'], deny: [] },
		});
		const run = jest.fn().mockResolvedValue('done');
		const events = await collect(
			runToolCall(
				fakeTool('bash', run),
				{ id: 'exec', name: 'bash', args: { command: 'echo $(pwd) > result.txt' } },
				undefined,
				undefined,
				{ runId: 'run', windowId: 1 }
			)
		);
		expect(events.some((event) => event.type === 'tool_permission_request')).toBe(false);
		expect(run).toHaveBeenCalledTimes(1);
	});

	it('asks before an outside command and reports the canonical location', async () => {
		const run = jest.fn().mockResolvedValue('done');
		const events = runToolCall(
			fakeTool('bash', run),
			{ id: 'exec', name: 'bash', args: { command: 'pwd', workdir: '/outside' } },
			undefined,
			undefined,
			{ runId: 'run', windowId: 1 }
		);
		await events.next();
		const request = (await events.next()).value;
		expect(request).toMatchObject({
			type: 'tool_permission_request',
			targets: [path.resolve('/outside')],
			reason: 'outside_trusted_location',
			persistable: true,
		});
		if (!request || request.type !== 'tool_permission_request') throw new Error('Expected approval');
		const end = events.next();
		respondToolPermission(
			{
				approvalId: request.approvalId,
				runId: 'run',
				toolName: request.toolName,
				inputFingerprint: request.inputFingerprint,
			},
			'approve_always',
			1
		);
		await end;
		expect(addPermissionRule).toHaveBeenCalledWith('exec', 'allow', `${path.resolve('/outside')}/**`);
		expect(run).toHaveBeenCalledTimes(1);
	});

	it('passes a one-time outside grant to the real exec sandbox', async () => {
		const wrapped = jest.fn(async (_command: string) => ({
			command: '/bin/true',
			args: [],
			env: {},
			commandId: 'command',
		}));
		const sandbox = {
			wrap: wrapped,
			track: jest.fn(),
			cleanup: jest.fn(),
			annotate: jest.fn((_id: string, stderr: string) => stderr),
		} as unknown as ExecSandbox;
		const events = runToolCall(
			execTool(sandbox),
			{ id: 'exec', name: 'bash', args: { command: 'pwd', workdir: '/outside' } },
			undefined,
			undefined,
			{ runId: 'run', windowId: 1 }
		);
		await events.next();
		const request = (await events.next()).value;
		if (!request || request.type !== 'tool_permission_request') throw new Error('Expected approval');
		const end = events.next();
		respondToolPermission(
			{
				approvalId: request.approvalId,
				runId: 'run',
				toolName: request.toolName,
				inputFingerprint: request.inputFingerprint,
			},
			'approve',
			1
		);
		await end;
		expect(wrapped).toHaveBeenCalledWith(
			'pwd',
			path.resolve('/outside'),
			expect.any(String),
			expect.any(AbortSignal),
			[path.resolve('/outside')]
		);
	});

	it('never offers a persistent grant for host execution', async () => {
		const events = runToolCall(
			fakeTool('bash', jest.fn()),
			{ id: 'host', name: 'bash', args: { command: 'pwd', elevated: true } },
			undefined,
			undefined,
			{ runId: 'run', windowId: 1 }
		);
		await events.next();
		const request = (await events.next()).value;
		expect(request).toMatchObject({
			type: 'tool_permission_request',
			reason: 'host_execution',
			persistable: false,
		});
		if (!request || request.type !== 'tool_permission_request') throw new Error('Expected approval');
		const end = events.next();
		respondToolPermission(
			{
				approvalId: request.approvalId,
				runId: 'run',
				toolName: request.toolName,
				inputFingerprint: request.inputFingerprint,
			},
			'reject',
			1
		);
		await end;
	});
});

describe('per-run file access', () => {
	it('reuses a successful read directory only in the originating run', async () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-read-context-'));
		const read = jest.fn().mockResolvedValue('content');
		const tool = fakeTool('read', read);
		const first = createRunContext().fileAccess;
		const second = createRunContext().fileAccess;

		await approveCall(tool, {
			id: 'first',
			name: 'read',
			args: { path: path.join(root, 'first.txt') },
		}, first, 'run-one');

		const reused = await collect(
			runToolCall(
				tool,
				{ id: 'second', name: 'read', args: { path: path.join(root, 'second.txt') } },
				new AbortController().signal,
				first,
				{ runId: 'run-one' }
			)
		);
		expect(reused.some((event) => event.type === 'tool_permission_request')).toBe(false);

		const isolated = await collect(
			runToolCall(
				tool,
				{ id: 'third', name: 'read', args: { path: path.join(root, 'third.txt') } },
				new AbortController().signal,
				second,
				{ runId: 'run-two' }
			)
		);
		expect(isolated.at(-1)).toMatchObject({ type: 'tool_call_end', isError: true });
		expect(first.readDirectories.size).toBe(1);
		expect(second.readDirectories.size).toBe(0);
	});

	it('allows editing only the exact file newly created in the same run', async () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-create-context-'));
		const target = path.join(root, 'one', 'example.txt');
		const other = path.join(root, 'two', 'example.txt');
		getPermissions.mockReturnValue({
			...emptyPermissions,
			write: { allow: [realPath(target)], deny: [] },
		});
		const write = jest.fn().mockResolvedValue({ path: target });
		const edit = jest.fn().mockResolvedValue({ path: target });
		const fileAccess = createRunContext().fileAccess;
		await collect(
			runToolCall(
				fakeTool('write', write),
				{ id: 'write', name: 'write', args: { path: target, content: 'one' } },
				new AbortController().signal,
				fileAccess,
				{ runId: 'run' }
			)
		);

		getPermissions.mockReturnValue(emptyPermissions);
		const exact = await collect(
			runToolCall(
				fakeTool('edit', edit),
				{
					id: 'edit',
					name: 'edit',
					args: { path: target, oldText: 'one', newText: 'two' },
				},
				new AbortController().signal,
				fileAccess,
				{ runId: 'run' }
			)
		);
		expect(exact.at(-1)).toMatchObject({ type: 'tool_call_end', isError: undefined });
		expect(edit).toHaveBeenCalledTimes(1);

		const differentPath = await collect(
			runToolCall(
				fakeTool('edit', edit),
				{
					id: 'other',
					name: 'edit',
					args: { path: other, oldText: 'one', newText: 'two' },
				},
				new AbortController().signal,
				fileAccess,
				{ runId: 'run' }
			)
		);
		expect(differentPath.at(-1)).toMatchObject({ type: 'tool_call_end', isError: true });
		expect(fileAccess.createdFiles).toEqual(new Set([realPath(target)]));
	});

	it('does not remember failed reads or failed file creation', async () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-failed-context-'));
		const readPath = path.join(root, 'read.txt');
		const writePath = path.join(root, 'write.txt');
		getPermissions.mockReturnValue({
			read: { allow: [realPath(readPath)], deny: [] },
			write: { allow: [realPath(writePath)], deny: [] },
			exec: { allow: [], deny: [] },
		});
		const fileAccess = createRunContext().fileAccess;

		await collect(
			runToolCall(
				fakeTool('read', jest.fn().mockRejectedValue(new Error('read failed'))),
				{ id: 'read', name: 'read', args: { path: readPath } },
				new AbortController().signal,
				fileAccess,
				{ runId: 'run' }
			)
		);
		await collect(
			runToolCall(
				fakeTool('write', jest.fn().mockRejectedValue(new Error('write failed'))),
				{ id: 'write', name: 'write', args: { path: writePath } },
				new AbortController().signal,
				fileAccess,
				{ runId: 'run' }
			)
		);

		expect(fileAccess.readDirectories.size).toBe(0);
		expect(fileAccess.createdFiles.size).toBe(0);
	});

	it('does not let a contextual grant override a configured deny', async () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-deny-context-'));
		const target = path.join(root, 'example.txt');
		const fileAccess = createRunContext().fileAccess;
		fileAccess.readDirectories.add(root);
		getPermissions.mockReturnValue({
			...emptyPermissions,
			read: { allow: [], deny: [target] },
		});
		const read = jest.fn().mockResolvedValue('content');

		const events = await collect(
			runToolCall(
				fakeTool('read', read),
				{ id: 'deny', name: 'read', args: { path: target } },
				new AbortController().signal,
				fileAccess,
				{ runId: 'run' }
			)
		);
		expect(events.at(-1)).toMatchObject({ type: 'tool_call_end', isError: true });
		expect(read).not.toHaveBeenCalled();
	});
});

async function approveCall(
	tool: Tool,
	call: ToolCall,
	fileAccess: ReturnType<typeof createRunContext>['fileAccess'],
	runId: string
): Promise<void> {
	const events = runToolCall(
		tool,
		call,
		new AbortController().signal,
		fileAccess,
		{ runId, windowId: 1 }
	);
	expect((await events.next()).value).toMatchObject({ type: 'tool_call_start' });
	const request = (await events.next()).value;
	if (!request || request.type !== 'tool_permission_request') throw new Error('Expected approval');
	const end = events.next();
	expect(
		respondToolPermission(
			{
				approvalId: request.approvalId,
				runId,
				toolName: request.toolName,
				inputFingerprint: request.inputFingerprint,
			},
			'approve',
			1
		)
	).toBe(true);
	expect((await end).value).toMatchObject({ type: 'tool_call_end', isError: undefined });
}

async function collect(events: AsyncGenerator<RuntimeEvent, void>): Promise<RuntimeEvent[]> {
	const collected: RuntimeEvent[] = [];
	for await (const event of events) collected.push(event);
	return collected;
}

function fakeTool(id: string, run: jest.Mock): Tool {
	return jsonTool({
		id,
		name: id,
		description: id,
		schema: { type: 'object' },
		execute: run,
	});
}
