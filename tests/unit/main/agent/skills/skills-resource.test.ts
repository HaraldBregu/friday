import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveSkillResource } from '../../../../../src/main/agent/skills/skills_resolve_resource';

describe('resolveSkillResource', () => {
	it('resolves contained files and rejects traversal, absolute paths, and escaping symlinks', () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-skill-resource-'));
		const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-skill-outside-'));
		try {
			fs.mkdirSync(path.join(root, 'references'));
			fs.writeFileSync(path.join(root, 'references', 'guide.md'), 'guide');
			fs.writeFileSync(path.join(outside, 'secret.txt'), 'secret');
			fs.symlinkSync(path.join(outside, 'secret.txt'), path.join(root, 'escape.txt'));
			expect(resolveSkillResource(root, 'references/guide.md')).toBe(
				fs.realpathSync(path.join(root, 'references', 'guide.md'))
			);
			expect(() => resolveSkillResource(root, '../secret.txt')).toThrow('outside');
			expect(() => resolveSkillResource(root, path.join(outside, 'secret.txt'))).toThrow(
				'relative path'
			);
			expect(() => resolveSkillResource(root, 'C:\\secret.txt')).toThrow('relative path');
			expect(() => resolveSkillResource(root, 'escape.txt')).toThrow('outside');
		} finally {
			fs.rmSync(root, { recursive: true, force: true });
			fs.rmSync(outside, { recursive: true, force: true });
		}
	});
});
