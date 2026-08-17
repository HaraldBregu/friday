import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyPatchTool } from '../../../../../src/main/agent/tools/core/patch';
import { writeTool } from '../../../../../src/main/agent/tools/core/write';
import { processTool } from '../../../../../src/main/agent/tools/core/process';
import type { Tool } from '../../../../../src/main/agent/types';

function requiresHardApproval(tool: Tool, input: Record<string, unknown>): boolean {
	return typeof tool.hardApproval === 'function'
		? tool.hardApproval(input)
		: tool.hardApproval === true;
}

it('classifies process termination as a hard approval', () => {
	expect(requiresHardApproval(processTool, { action: 'kill', sessionId: 'session' })).toBe(true);
	expect(requiresHardApproval(processTool, { action: 'clear', sessionId: 'session' })).toBe(true);
	expect(requiresHardApproval(processTool, { action: 'remove', sessionId: 'session' })).toBe(true);
	expect(requiresHardApproval(processTool, { action: 'log', sessionId: 'session' })).toBe(false);
});

it('classifies file deletion and overwrite as hard approvals', () => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'friday-destructive-tool-'));
	const existing = path.join(directory, 'existing.txt');
	fs.writeFileSync(existing, 'content');

	expect(
		requiresHardApproval(applyPatchTool, {
			input: '*** Begin Patch\n*** Delete File: /tmp/example\n*** End Patch',
		})
	).toBe(true);
	expect(
		requiresHardApproval(applyPatchTool, {
			input: '*** Begin Patch\n*** Add File: /tmp/example\n+content\n*** End Patch',
		})
	).toBe(false);
	expect(
		requiresHardApproval(applyPatchTool, {
			input:
				'*** Begin Patch\n*** Update File: /tmp/example\n*** Move to: /tmp/moved\n@@\n-content\n+updated\n*** End Patch',
		})
	).toBe(true);
	expect(requiresHardApproval(writeTool, { path: existing, content: 'replacement' })).toBe(true);
	expect(
		requiresHardApproval(writeTool, { path: path.join(directory, 'new.txt'), content: 'new' })
	).toBe(false);
});
