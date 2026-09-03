import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SKILL_RESOURCE_MAX_BYTES } from '../../../../../src/main/agent/skills/skills_limits';
import { validateSkillPackage } from '../../../../../src/main/agent/skills/skills_validate_package';

describe('validateSkillPackage', () => {
	it('rejects oversized resources and escaping symlinks', () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-skill-package-'));
		const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-skill-package-outside-'));
		try {
			fs.writeFileSync(path.join(root, 'large.bin'), '');
			fs.truncateSync(path.join(root, 'large.bin'), SKILL_RESOURCE_MAX_BYTES + 1);
			expect(() => validateSkillPackage(root)).toThrow('resource exceeds');
			fs.rmSync(path.join(root, 'large.bin'));
			fs.writeFileSync(path.join(outside, 'secret.txt'), 'secret');
			fs.symlinkSync(path.join(outside, 'secret.txt'), path.join(root, 'escape.txt'));
			expect(() => validateSkillPackage(root)).toThrow('outside');
		} finally {
			fs.rmSync(root, { recursive: true, force: true });
			fs.rmSync(outside, { recursive: true, force: true });
		}
	});
});
