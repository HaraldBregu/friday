const invoke = jest.fn();
const on = jest.fn();
const removeListener = jest.fn();

jest.mock('electron', () => ({
	ipcRenderer: { invoke, on, removeListener },
}));

import { coder } from '../../../../src/preload/coder';
import { CoderChannels } from '../../../../src/shared/ipc_channels_definitions';

beforeEach(() => {
	jest.clearAllMocks();
	invoke.mockResolvedValue({
		success: true,
		data: { projectId: 'project-1', sessionId: 'session-1', output: 'reply' },
	});
});

it('normalizes run requests, filters events, and removes the exact event listener', async () => {
	const callback = jest.fn();
	const request = {
		projectId: ' project-1 ',
		sessionId: ' session-1 ',
		mode: 'agent' as const,
		input: ' inspect ',
	};
	const pending = coder.send(request, callback);

	const runId = invoke.mock.calls[0][2];
	const listener = on.mock.calls[0][1];
	listener(
		{},
		{
			type: 'text-delta',
			runId: 'different-run',
			projectId: 'project-1',
			sessionId: 'session-1',
			delta: 'ignored',
		}
	);
	listener(
		{},
		{
			type: 'text-delta',
			runId,
			projectId: 'project-1',
			sessionId: 'session-1',
			delta: 'kept',
		}
	);
	await expect(pending).resolves.toEqual({
		projectId: 'project-1',
		sessionId: 'session-1',
		output: 'reply',
	});

	expect(invoke).toHaveBeenCalledWith(
		CoderChannels.send,
		{
			projectId: 'project-1',
			sessionId: 'session-1',
			mode: 'agent',
			input: 'inspect',
		},
		expect.any(String)
	);
	expect(on).toHaveBeenCalledWith(CoderChannels.response, expect.any(Function));
	expect(removeListener).toHaveBeenCalledWith(CoderChannels.response, on.mock.calls[0][1]);
	expect(callback).toHaveBeenCalledTimes(1);
	expect(callback).toHaveBeenCalledWith(expect.objectContaining({ delta: 'kept' }));
	expect(runId).toHaveLength(36);
	expect(() => coder.send({ projectId: 'project-1', mode: 'agent', input: ' ' })).toThrow(
		'Invalid coder run request.'
	);
});

it('normalizes project and session identifiers before forwarding them', async () => {
	await coder.openProject(' project-1 ');
	expect(invoke).toHaveBeenCalledWith(CoderChannels.openProject, 'project-1');

	await coder.listSessions(' project-1 ');
	expect(invoke).toHaveBeenCalledWith(CoderChannels.listSessions, 'project-1');

	await coder.getSession(' project-1 ', ' session-1 ');
	expect(invoke).toHaveBeenCalledWith(CoderChannels.getSession, 'project-1', 'session-1');

	await coder.renameSession(' project-1 ', ' session-1 ', ' Focused tests ');
	expect(invoke).toHaveBeenCalledWith(
		CoderChannels.renameSession,
		'project-1',
		'session-1',
		'Focused tests'
	);

	await coder.deleteSession(' project-1 ', ' session-1 ');
	expect(invoke).toHaveBeenCalledWith(CoderChannels.deleteSession, 'project-1', 'session-1');

	await coder.getProjectInstructions(' project-1 ');
	expect(invoke).toHaveBeenCalledWith(CoderChannels.getProjectInstructions, 'project-1');

	const update = { content: '  keep whitespace\n', expectedRevision: 'revision-1' };
	await coder.saveProjectInstructions(' project-1 ', update);
	expect(invoke).toHaveBeenCalledWith(
		CoderChannels.saveProjectInstructions,
		'project-1',
		update
	);

	expect(() => coder.removeProject(' ')).toThrow('Invalid coder project id.');
	expect(() => coder.getSession('project-1', ' ')).toThrow('Invalid coder session.');
	expect(() => coder.renameSession('project-1', 'session-1', ' ')).toThrow(
		'Invalid coder session title.'
	);
	expect(() =>
		coder.saveProjectInstructions('project-1', { content: 'content', expectedRevision: '' })
	).toThrow('Invalid coder project instructions.');
});

it('validates settings before forwarding them to main', () => {
	expect(() =>
		coder.saveSettings({
			runtime: 'pi',
			providerId: 'unsupported',
			modelId: 'model',
			thinkingLevel: 'medium',
			toolMode: 'read-only',
		} as never)
	).toThrow('Invalid coder settings.');
});
