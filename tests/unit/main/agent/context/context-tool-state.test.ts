import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { realPath } from '../../../../../src/main/shared/real_path';
import {
	fileToolState,
	hasCreatedFile,
	hasToolPermission,
	rememberTool,
	createRunContext,
} from '../../../../../src/main/agent/context';

describe('tool context state', () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'friday-context-'));

	it('stores the tool name, canonical path, and directory', () => {
		const context = createRunContext().fileAccess;
		const state = fileToolState('write', { path: 'directory/example.txt' }, root);

		expect(state).toEqual({
			toolName: 'write',
			path: realPath(path.join(root, 'directory', 'example.txt')),
			directory: realPath(path.join(root, 'directory')),
		});
		rememberTool(context, state!);
		expect(hasCreatedFile(context, state!.path)).toBe(true);
	});

	it('matches the full path rather than only the file name', () => {
		const context = createRunContext().fileAccess;
		const created = fileToolState('write', { path: 'one/example.txt' }, root)!;
		const other = fileToolState('edit', { path: 'two/example.txt' }, root)!;
		rememberTool(context, created);

		expect(hasCreatedFile(context, other.path)).toBe(false);
	});

	it('stores and matches an allowed tool folder exactly', () => {
		const context = createRunContext().fileAccess;
		const state = fileToolState('read', { path: 'readable/example.txt' }, root)!;
		rememberTool(context, state);

		expect(context.readDirectories).toEqual(new Set([state.directory]));
		expect(hasToolPermission(context, state.directory)).toBe(true);
		expect(hasToolPermission(context, path.join(state.directory, 'nested'))).toBe(false);
	});

	it('does not share file grants between run contexts', () => {
		const first = createRunContext();
		const second = createRunContext();
		const state = fileToolState('read', { path: 'readable/example.txt' }, root)!;
		rememberTool(first.fileAccess, state);

		expect(first.fileAccess.readDirectories).toContain(state.directory);
		expect(second.fileAccess.readDirectories).not.toContain(state.directory);
		expect(first.fileAccess).not.toBe(second.fileAccess);
	});
});
