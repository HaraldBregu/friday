import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { activateSkill } from '../../../../../src/main/agent/skills/skills_activate';
import type { SkillInfo, SkillRegistrySnapshot } from '../../../../../src/shared/skills_types';

describe('activateSkill', () => {
	it('returns exact instructions, canonical root, hash, and contained resources', async () => {
		const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'kucedr-skill-load-'));
		const root = path.join(parent, 'writer');
		const source = '---\nname: writer\ndescription: Writes\nallowed-tools: read\n---\nExact body';
		try {
			fs.mkdirSync(path.join(root, 'references'), { recursive: true });
			fs.writeFileSync(path.join(root, 'SKILL.md'), source);
			fs.writeFileSync(path.join(root, 'references', 'guide.md'), 'guide');
			const info: SkillInfo = {
				id: 'writer',
				name: 'writer',
				description: 'Writes',
				location: root,
				folderPath: root,
				skillPath: path.join(root, 'SKILL.md'),
				manifest: { name: 'writer', description: 'Writes', allowedTools: ['read'] },
				source: 'local-filesystem',
				trust: 'user-controlled',
				hash: createHash('sha256').update(source).digest('hex'),
			};
			const snapshot: SkillRegistrySnapshot = { skills: [info], diagnostics: [] };
			const loaded = await activateSkill(snapshot, 'writer');
			expect(loaded).toEqual(
				expect.objectContaining({
					canonicalRoot: fs.realpathSync(root),
					instructions: 'Exact body',
					hash: info.hash,
					resources: ['references/guide.md'],
				})
			);
			fs.appendFileSync(path.join(root, 'SKILL.md'), '\nchanged');
			await expect(activateSkill(snapshot, 'writer')).rejects.toThrow(
				'changed while it was loading'
			);
		} finally {
			fs.rmSync(parent, { recursive: true, force: true });
		}
	});

	it('fails for unknown skills', async () => {
		await expect(activateSkill({ skills: [], diagnostics: [] }, 'missing')).rejects.toThrow(
			'not found'
		);
	});
});
