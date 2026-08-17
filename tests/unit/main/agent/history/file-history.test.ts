import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { captureFiles } from '../../../../../src/main/agent/history/capture';
import { recordFileOperation } from '../../../../../src/main/agent/history/record';
import { redoFileOperation } from '../../../../../src/main/agent/history/redo';
import type { FileHistory } from '../../../../../src/main/agent/history/types';
import { undoFileOperation } from '../../../../../src/main/agent/history/undo';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'friday-history-'));
let history: FileHistory;

beforeEach(() => { history = { operations: [] }; });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

it('undoes and redoes a file creation in session memory', () => {
	fs.mkdirSync(root, { recursive: true });
	const target = path.join(root, 'created.txt');
	const before = captureFiles([target]);
	fs.writeFileSync(target, 'created');
	recordFileOperation(history, 'run', 'call', 'write', before, captureFiles([target]));

	undoFileOperation(history);
	expect(fs.existsSync(target)).toBe(false);
	redoFileOperation(history);
	expect(fs.readFileSync(target, 'utf8')).toBe('created');
});

it('restores deleted content and refuses to overwrite divergent changes', () => {
	fs.mkdirSync(root, { recursive: true });
	const target = path.join(root, 'deleted.txt');
	fs.writeFileSync(target, 'original');
	const before = captureFiles([target]);
	fs.rmSync(target);
	recordFileOperation(history, 'run', 'call', 'patch', before, captureFiles([target]));

	undoFileOperation(history);
	expect(fs.readFileSync(target, 'utf8')).toBe('original');
	fs.writeFileSync(target, 'newer');
	expect(() => redoFileOperation(history)).toThrow('Files changed');
});

it('isolates operations between active sessions', () => {
	const other: FileHistory = { operations: [] };
	expect(() => undoFileOperation(other)).toThrow('no file operation');
	expect(history.operations).toEqual([]);
});
