import path from 'node:path';

export function planCommandError(
	input: Record<string, unknown>,
	workspace: string
): string | undefined {
	if (input.env && typeof input.env === 'object' && Object.keys(input.env).length > 0)
		return 'Plan commands cannot override the sandbox helper environment.';
	if (input.background === true) return 'Plan commands cannot run in the background.';
	if (input.elevated === true) return 'Plan commands cannot run outside the sandbox.';
	if (input.pty === true) return 'Plan commands cannot use a PTY.';
	if (input.host === 'gateway' || input.host === 'node') {
		return 'Plan commands cannot use an external host.';
	}
	if (Array.isArray(input.additionalRoots) && input.additionalRoots.length > 0) {
		return 'Plan commands cannot access additional roots.';
	}
	const workdir = typeof input.workdir === 'string' ? input.workdir : '.';
	if (/^(?:\\\\|\/\/|\\\\[?.]\\)/.test(workdir) || workdir.startsWith('~')) {
		return 'Plan commands must run inside the workspace.';
	}
	const relative = path.relative(workspace, path.resolve(workspace, workdir));
	if (relative.startsWith('..') || path.isAbsolute(relative)) {
		return 'Plan commands must run inside the workspace.';
	}
	return undefined;
}
