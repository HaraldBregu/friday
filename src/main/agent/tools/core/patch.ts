import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { agentLocation } from '../../../shared/agent_location';
import { resolveUserPath } from '../../../shared/user_path';
import { tool } from '../tool';
import { atomicWrite } from '../../../shared/atomic_write';

const BEGIN_PATCH_MARKER = '*** Begin Patch';
const END_PATCH_MARKER = '*** End Patch';
const ADD_FILE_MARKER = '*** Add File: ';
const DELETE_FILE_MARKER = '*** Delete File: ';
const UPDATE_FILE_MARKER = '*** Update File: ';
const MOVE_TO_MARKER = '*** Move to: ';
const EOF_MARKER = '*** End of File';

type UpdateChunk = {
	changeContext?: string;
	oldLines: string[];
	newLines: string[];
	isEndOfFile: boolean;
};

type Hunk =
	| { kind: 'add'; path: string; contents: string }
	| { kind: 'delete'; path: string }
	| { kind: 'update'; path: string; movePath?: string; chunks: UpdateChunk[] };

function parsePatch(input: string): Hunk[] {
	const lines = input.trim().split(/\r?\n/);
	if (lines[0]?.trim() !== BEGIN_PATCH_MARKER)
		throw new Error("The first line of the patch must be '*** Begin Patch'");
	if (lines[lines.length - 1]?.trim() !== END_PATCH_MARKER)
		throw new Error("The last line of the patch must be '*** End Patch'");

	const hunks: Hunk[] = [];
	let remaining = lines.slice(1, -1);
	let lineNumber = 2;
	while (remaining.length > 0) {
		const { hunk, consumed } = parseHunk(remaining, lineNumber);
		hunks.push(hunk);
		lineNumber += consumed;
		remaining = remaining.slice(consumed);
	}
	if (hunks.length === 0) throw new Error('Patch contains no file hunks.');
	return hunks;
}

function parseHunk(lines: string[], lineNumber: number): { hunk: Hunk; consumed: number } {
	const first = lines[0].trim();

	if (first.startsWith(ADD_FILE_MARKER)) {
		let contents = '';
		let consumed = 1;
		for (const line of lines.slice(1)) {
			if (!line.startsWith('+')) break;
			contents += `${line.slice(1)}\n`;
			consumed += 1;
		}
		return { hunk: { kind: 'add', path: first.slice(ADD_FILE_MARKER.length), contents }, consumed };
	}

	if (first.startsWith(DELETE_FILE_MARKER)) {
		return { hunk: { kind: 'delete', path: first.slice(DELETE_FILE_MARKER.length) }, consumed: 1 };
	}

	if (first.startsWith(UPDATE_FILE_MARKER)) {
		const targetPath = first.slice(UPDATE_FILE_MARKER.length);
		let remaining = lines.slice(1);
		let consumed = 1;
		let movePath: string | undefined;
		if (remaining[0]?.trim().startsWith(MOVE_TO_MARKER)) {
			movePath = remaining[0].trim().slice(MOVE_TO_MARKER.length);
			remaining = remaining.slice(1);
			consumed += 1;
		}

		const chunks: UpdateChunk[] = [];
		while (remaining.length > 0) {
			if (remaining[0].trim() === '') {
				remaining = remaining.slice(1);
				consumed += 1;
				continue;
			}
			if (remaining[0].startsWith('***')) break;
			const { chunk, consumed: chunkLines } = parseUpdateChunk(
				remaining,
				lineNumber + consumed,
				chunks.length === 0
			);
			chunks.push(chunk);
			remaining = remaining.slice(chunkLines);
			consumed += chunkLines;
		}
		if (chunks.length === 0)
			throw new Error(
				`Invalid patch hunk at line ${lineNumber}: Update file hunk for path '${targetPath}' is empty`
			);
		return { hunk: { kind: 'update', path: targetPath, movePath, chunks }, consumed };
	}

	throw new Error(
		`Invalid patch hunk at line ${lineNumber}: '${lines[0]}' is not a valid hunk header. Valid hunk headers: '*** Add File: {path}', '*** Delete File: {path}', '*** Update File: {path}'`
	);
}

function parseUpdateChunk(
	lines: string[],
	lineNumber: number,
	allowMissingContext: boolean
): { chunk: UpdateChunk; consumed: number } {
	let changeContext: string | undefined;
	let startIndex = 0;
	if (lines[0] === '@@') {
		startIndex = 1;
	} else if (lines[0].startsWith('@@ ')) {
		changeContext = lines[0].slice(3);
		startIndex = 1;
	} else if (!allowMissingContext) {
		throw new Error(
			`Invalid patch hunk at line ${lineNumber}: Expected update hunk to start with a @@ context marker, got: '${lines[0]}'`
		);
	}

	const chunk: UpdateChunk = { changeContext, oldLines: [], newLines: [], isEndOfFile: false };
	let parsedLines = 0;
	for (const line of lines.slice(startIndex)) {
		if (line === EOF_MARKER) {
			chunk.isEndOfFile = true;
			parsedLines += 1;
			break;
		}
		const marker = line[0];
		if (!marker) {
			chunk.oldLines.push('');
			chunk.newLines.push('');
		} else if (marker === ' ') {
			chunk.oldLines.push(line.slice(1));
			chunk.newLines.push(line.slice(1));
		} else if (marker === '+') {
			chunk.newLines.push(line.slice(1));
		} else if (marker === '-') {
			chunk.oldLines.push(line.slice(1));
		} else {
			if (parsedLines === 0)
				throw new Error(
					`Invalid patch hunk at line ${lineNumber}: Unexpected line found in update hunk: '${line}'. Every line should start with ' ' (context line), '+' (added line), or '-' (removed line)`
				);
			break;
		}
		parsedLines += 1;
	}
	if (parsedLines === 0)
		throw new Error(
			`Invalid patch hunk at line ${lineNumber}: Update hunk does not contain any lines`
		);
	return { chunk, consumed: parsedLines + startIndex };
}

function seekSequence(
	lines: string[],
	pattern: string[],
	start: number,
	eof: boolean
): number | null {
	if (pattern.length === 0) return start;
	if (pattern.length > lines.length) return null;
	const maxStart = lines.length - pattern.length;
	const searchStart = eof ? maxStart : start;
	if (searchStart > maxStart) return null;

	// ponytail: fuzzy fallbacks (trimEnd, then trim) tolerate whitespace drift in model output
	for (const normalize of [(v: string) => v, (v: string) => v.trimEnd(), (v: string) => v.trim()]) {
		for (let i = searchStart; i <= maxStart; i += 1) {
			if (pattern.every((p, idx) => normalize(lines[i + idx]) === normalize(p))) return i;
		}
	}
	return null;
}

function applyUpdateChunks(filePath: string, contents: string, chunks: UpdateChunk[]): string {
	const lines = contents.split('\n');
	if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

	const replacements: Array<[number, number, string[]]> = [];
	let lineIndex = 0;
	for (const chunk of chunks) {
		if (chunk.changeContext) {
			const ctxIndex = seekSequence(lines, [chunk.changeContext], lineIndex, false);
			if (ctxIndex === null)
				throw new Error(`Failed to find context '${chunk.changeContext}' in ${filePath}`);
			lineIndex = ctxIndex + 1;
		}

		if (chunk.oldLines.length === 0) {
			const insertionIndex = chunk.changeContext && !chunk.isEndOfFile ? lineIndex : lines.length;
			replacements.push([insertionIndex, 0, chunk.newLines]);
			lineIndex = insertionIndex;
			continue;
		}

		let pattern = chunk.oldLines;
		let newSlice = chunk.newLines;
		let found = seekSequence(lines, pattern, lineIndex, chunk.isEndOfFile);
		if (found === null && pattern[pattern.length - 1] === '') {
			pattern = pattern.slice(0, -1);
			if (newSlice.length > 0 && newSlice[newSlice.length - 1] === '')
				newSlice = newSlice.slice(0, -1);
			found = seekSequence(lines, pattern, lineIndex, chunk.isEndOfFile);
		}
		if (found === null)
			throw new Error(
				`Failed to find expected lines in ${filePath}:\n${chunk.oldLines.join('\n')}`
			);
		replacements.push([found, pattern.length, newSlice]);
		lineIndex = found + pattern.length;
	}

	replacements.sort((a, b) => a[0] - b[0]);
	const result = [...lines];
	for (const [startIndex, oldLen, newLines] of [...replacements].reverse()) {
		result.splice(startIndex, oldLen, ...newLines);
	}
	if (result.length === 0 || result[result.length - 1] !== '') result.push('');
	return result.join('\n');
}

export const applyPatchTool = tool({
	id: 'patch',
	name: 'Apply patch',
	description:
		'Apply a multi-file patch using the *** Begin Patch/*** End Patch format. Supports Add File, Delete File, and Update File (with optional Move to) hunks.',
	hardApproval: ({ input }) =>
		/^\s*\*\*\* Delete File:/m.test(input) || /^\s*\*\*\* Move to:/m.test(input),
	inputSchema: z.object({
		input: z.string().min(1).describe('Patch content using the *** Begin Patch/End Patch format.'),
	}),
	execute: async ({ input }) => {
		const hunks = parsePatch(input);
		const added: string[] = [];
		const modified: string[] = [];
		const deleted: string[] = [];

		for (const hunk of hunks) {
			const target = resolveUserPath(hunk.path, agentLocation());
			if (hunk.kind === 'add') {
				await fs.mkdir(path.dirname(target), { recursive: true });
				await atomicWrite(target, hunk.contents);
				added.push(target);
			} else if (hunk.kind === 'delete') {
				await fs.rm(target);
				deleted.push(target);
			} else {
				const contents = await fs.readFile(target, 'utf8');
				const applied = applyUpdateChunks(target, contents, hunk.chunks);
				if (hunk.movePath) {
					const moveTarget = resolveUserPath(hunk.movePath, agentLocation());
					await fs.mkdir(path.dirname(moveTarget), { recursive: true });
					await atomicWrite(moveTarget, applied);
					if (moveTarget !== target) await fs.rm(target);
					modified.push(moveTarget);
				} else {
					await atomicWrite(target, applied);
					modified.push(target);
				}
			}
		}

		return {
			summary: [
				...added.map((f) => `A ${f}`),
				...modified.map((f) => `M ${f}`),
				...deleted.map((f) => `D ${f}`),
			].join('\n'),
		};
	},
});
