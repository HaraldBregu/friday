import { mkdir, mkdtemp, open, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { readWikiPage } from '../../../../../src/main/agent/knowledge/wiki/wiki_read_page';
import { readKnowledgeText } from '../../../../../src/main/agent/knowledge/read';
import { listKnowledgeFiles } from '../../../../../src/main/agent/knowledge/list';
import { readFileBounded } from '../../../../../src/main/agent/files/read';
import { KNOWLEDGE_MAX_FILE_BYTES, KNOWLEDGE_MAX_TOTAL_BYTES } from '../../../../../src/main/agent/knowledge/limits';

let root: string;
beforeEach(async () => { root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'kucedr-knowledge-boundary-'))); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

it('rejects external wiki page and index symlinks before returning outside bytes', async () => {
	const wiki = path.join(root, 'wiki'); await mkdir(wiki);
	await writeFile(path.join(root, 'outside'), 'SYNTHETIC_PRIVATE_CONTENT');
	await symlink(path.join(root, 'outside'), path.join(wiki, 'leak.md'));
	await expect(readWikiPage('leak', wiki)).rejects.toThrow('source symlink');
	await symlink(path.join(root, 'outside'), path.join(wiki, 'index.md'));
	await expect(readKnowledgeText(wiki, 'index.md')).rejects.toThrow('Symbolic links');
});

it('rejects relative escapes and symlink parent directories', async () => {
	const wiki = path.join(root, 'wiki'); await mkdir(wiki);
	await mkdir(path.join(root, 'outside'));
	await writeFile(path.join(root, 'outside', 'secret.md'), 'fake private content');
	await symlink(path.join(root, 'outside'), path.join(wiki, 'linked'));
	await expect(readKnowledgeText(wiki, '../outside/secret.md')).rejects.toThrow('escapes');
	await expect(readKnowledgeText(wiki, 'linked/secret.md')).rejects.toThrow('Symbolic links');
});

it('rejects sparse oversized files and aggregate trees before allocating their contents', async () => {
	const file = path.join(root, 'large.md'); const handle = await open(file, 'w');
	await handle.truncate(KNOWLEDGE_MAX_FILE_BYTES + 1); await handle.close();
	await expect(readFileBounded(file, KNOWLEDGE_MAX_FILE_BYTES)).rejects.toThrow('byte limit');
	const huge = await open(file, 'w'); await huge.truncate(KNOWLEDGE_MAX_TOTAL_BYTES + 1); await huge.close();
	await expect(listKnowledgeFiles(root)).rejects.toThrow('corpus byte limit');
});

it('honors cancellation and returns a normal contained page', async () => {
	await writeFile(path.join(root, 'page.md'), '# Page');
	await expect(readWikiPage('page', root)).resolves.toMatchObject({ content: '# Page' });
	const controller = new AbortController(); controller.abort(new Error('stopped'));
	await expect(readFileBounded(path.join(root, 'page.md'), 100, controller.signal)).rejects.toThrow('stopped');
	await expect(listKnowledgeFiles(root, controller.signal)).rejects.toThrow('stopped');
});
