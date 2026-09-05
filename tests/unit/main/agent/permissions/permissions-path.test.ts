import os from 'node:os';
import path from 'node:path';
import { resolveUserPath } from '../../../../../src/main/shared/user_path';
import { isPathWithin } from '../../../../../src/main/agent/permissions/permissions_path';

const agentDir = path.resolve('/appdata/agent');

describe('resolveUserPath', () => {
	it('expands a bare tilde to the home directory', () => {
		expect(resolveUserPath('~', agentDir)).toBe(os.homedir());
	});
	it('expands ~/ prefixes', () => {
		expect(resolveUserPath('~/docs', agentDir)).toBe(path.resolve(os.homedir(), 'docs'));
	});
	it('resolves relative paths from the agent directory', () => {
		expect(resolveUserPath('foo/bar', agentDir)).toBe(path.resolve(agentDir, 'foo/bar'));
	});
});

describe('isPathWithin', () => {
	it('is true for equal paths and descendants', () => {
		expect(isPathWithin('/a', '/a')).toBe(true);
		expect(isPathWithin('/a', '/a/b/c')).toBe(true);
		expect(isPathWithin('/a', '/a/..cache/file')).toBe(true);
	});
	it('is false for siblings and ancestors', () => {
		expect(isPathWithin('/a/b', '/a')).toBe(false);
		expect(isPathWithin('/a', '/b')).toBe(false);
	});
});
