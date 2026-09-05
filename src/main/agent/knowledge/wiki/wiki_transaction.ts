import { listKnowledgeFiles } from '../list';
import { cp, mkdir, mkdtemp, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { getWikiRepository } from './wiki_repository';
import type { WikiTransactionInput } from './types';
import { validateWiki } from './wiki_validate';

export async function transactWiki<T>(input: WikiTransactionInput<T>): Promise<T> {
	input.signal?.throwIfAborted();
	const parent = path.dirname(input.targetPath);
	await mkdir(parent, { recursive: true, mode: 0o700 });
	const transactionRoot = await mkdtemp(path.resolve(parent, `.wiki-${input.operationId}-`));
	const stagedPath = path.resolve(transactionRoot, 'wiki');
	const backupPath = path.resolve(transactionRoot, 'backup');
	const targetExists = await stat(input.targetPath)
		.then((value) => value.isDirectory())
		.catch(() => false);
	try {
		if (targetExists) {
			await listKnowledgeFiles(input.targetPath, input.signal);
			await cp(input.targetPath, stagedPath, { recursive: true, force: false });
		}
		else await mkdir(stagedPath, { recursive: true, mode: 0o700 });
		input.signal?.throwIfAborted();
		const result = await input.apply(stagedPath);
		input.signal?.throwIfAborted();
		const errors = await (input.validate
			? input.validate(stagedPath)
			: validateWiki(
					stagedPath,
					input.repository ?? getWikiRepository(input.targetPath),
					input.signal
				));
		if (errors.length > 0) throw new Error(`Wiki validation failed: ${errors.join('; ')}`);
		input.signal?.throwIfAborted();
		if (targetExists) await rename(input.targetPath, backupPath);
		try {
			await rename(stagedPath, input.targetPath);
		} catch (error) {
			if (targetExists) await rename(backupPath, input.targetPath).catch(() => undefined);
			throw error;
		}
		if (targetExists) await rm(backupPath, { recursive: true, force: true });
		return result;
	} finally {
		await rm(transactionRoot, { recursive: true, force: true }).catch(() => undefined);
	}
}
