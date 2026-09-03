import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { transactWiki } from '../../../../src/main/agent/knowledge/wiki/wiki_transaction';

describe('wiki transactions', () => {
	it('leaves the current wiki untouched when validation fails', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-transaction-'));
		const target = path.join(root, 'data');
		await import('node:fs/promises').then(({ mkdir }) => mkdir(target, { recursive: true }));
		await writeFile(path.join(target, 'index.md'), '# Original index\n', 'utf8');

		await expect(
			transactWiki({
				targetPath: target,
				operationId: 'operation-failing',
				apply: async (stagedPath) => {
					await writeFile(path.join(stagedPath, 'index.md'), '# Changed index\n', 'utf8');
					await writeFile(path.join(stagedPath, 'partial.md'), 'partial', 'utf8');
				},
				validate: async () => ['forced validation failure'],
			})
		).rejects.toThrow('forced validation failure');

		expect(await readFile(path.join(target, 'index.md'), 'utf8')).toBe('# Original index\n');
		await expect(readFile(path.join(target, 'partial.md'), 'utf8')).rejects.toMatchObject({
			code: 'ENOENT',
		});
	});

	it('replaces the complete wiki after successful validation', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'kucedr-wiki-transaction-'));
		const target = path.join(root, 'data');
		await import('node:fs/promises').then(({ mkdir }) => mkdir(target, { recursive: true }));
		await writeFile(path.join(target, 'index.md'), '# Original index\n', 'utf8');

		const result = await transactWiki({
			targetPath: target,
			operationId: 'operation-success',
			apply: async (stagedPath) => {
				await writeFile(path.join(stagedPath, 'index.md'), '# New index\n', 'utf8');
				return 'committed';
			},
			validate: async () => [],
		});

		expect(result).toBe('committed');
		expect(await readFile(path.join(target, 'index.md'), 'utf8')).toBe('# New index\n');
	});
});
