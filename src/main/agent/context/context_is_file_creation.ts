import fs from 'node:fs';
import type { FileToolState } from './context_types';

export function isFileCreation(state: FileToolState): boolean {
	if (state.toolName !== 'write') return false;
	try {
		fs.lstatSync(state.path);
		return false;
	} catch (error) {
		return (
			typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
		);
	}
}
