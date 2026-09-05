import { writeKnowledgeText } from '../../../../../src/main/agent/knowledge/write';
import { mkdir, mkdtemp, open, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises';
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

it('rejects replacing the configured wiki root with a symlink', async () => {
	const outside = path.join(root, 'outside'); await mkdir(outside);
	await writeFile(path.join(outside, 'page.md'), 'outside bytes');
	const linked = path.join(root, 'wiki'); await symlink(outside, linked);
	await expect(readKnowledgeText(linked, 'page.md')).rejects.toThrow('Symbolic links');
	await expect(listKnowledgeFiles(linked)).rejects.toThrow('Symbolic links');
});

it('creates private wiki pages and rejects a write through a linked parent', async () => {
 const wiki = path.join(root, 'wiki');
 await writeKnowledgeText(wiki, 'nested/page.md', '# Private page');
 expect((await stat(path.join(wiki, 'nested/page.md'))).mode & 0o777).toBe(0o600);
 expect((await stat(path.join(wiki, 'nested'))).mode & 0o777).toBe(0o700);
 const outside = path.join(root, 'outside'); await mkdir(outside);
 await symlink(outside, path.join(wiki, 'linked'));
 await expect(writeKnowledgeText(wiki, 'linked/new/page.md', 'private')).rejects.toThrow('Symbolic links');
 await expect(stat(path.join(outside, 'new'))).rejects.toMatchObject({ code: 'ENOENT' });
});

it('bounds depth and cumulative traversal across source folders', async () => {
 await mkdir(path.join(root, ...Array(13).fill('nested')), { recursive: true });
 await expect(listKnowledgeFiles(root)).rejects.toThrow('depth limit');
 await expect(listKnowledgeFiles(root, undefined, { entries: 10000, files: 0, bytes: 0 })).rejects.toThrow('entry limit');
});
