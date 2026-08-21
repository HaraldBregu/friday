import { act, renderHook, waitFor } from '@testing-library/react';
import { app, coder as coderApi } from '@friday/sdk';
import { useCoderWorkspace } from '../../../extensions/coder/src/hooks/workspace';
import { useConfiguration } from '../../../extensions/coder/src/hooks/configuration';

jest.mock('@friday/sdk', () => ({
	isFriday: () => true,
	app: {
		openExternalUrl: jest.fn(),
		getExtensionStoreValue: jest.fn(),
		setExtensionStoreValue: jest.fn(),
		deleteExtensionStoreValue: jest.fn(),
	},
	coder: {
		getSettings: jest.fn(),
		saveSettings: jest.fn(),
		listModels: jest.fn(),
		listProjects: jest.fn(),
		listSessions: jest.fn(),
		getSession: jest.fn(),
		send: jest.fn(),
		cancel: jest.fn(),
		addProject: jest.fn(),
		openProject: jest.fn(),
		removeProject: jest.fn(),
		connectCodex: jest.fn(),
		cancelCodexLogin: jest.fn(),
		disconnectCodex: jest.fn(),
	},
}));

const project = {
	id: 'project-1',
	name: 'friday',
	directory: '/workspace/friday',
	kind: 'agent-workspace' as const,
	createdAt: '2026-08-20T10:00:00.000Z',
	lastOpenedAt: '2026-08-20T10:00:00.000Z',
	available: true,
};

const otherProject = {
	...project,
	id: 'project-2',
	name: 'website',
	directory: '/workspace/website',
	kind: 'external' as const,
};

const session = {
	id: 'session-1',
	projectId: project.id,
	title: 'Existing session',
	createdAt: '2026-08-20T10:00:00.000Z',
	updatedAt: '2026-08-20T10:01:00.000Z',
	messageCount: 2,
};

const otherSession = {
	...session,
	id: 'session-2',
	projectId: otherProject.id,
	title: 'Website session',
};

beforeEach(() => {
	jest.clearAllMocks();
	(app.getExtensionStoreValue as jest.Mock).mockResolvedValue(project.id);
	(app.setExtensionStoreValue as jest.Mock).mockResolvedValue(undefined);
	(coderApi.getSettings as jest.Mock).mockResolvedValue({
		runtime: 'pi',
		providerId: 'openai-codex',
		modelId: 'gpt-coder',
		thinkingLevel: 'medium',
		toolMode: 'coding',
	});
	(coderApi.saveSettings as jest.Mock).mockImplementation(async (settings) => settings);
	(coderApi.listModels as jest.Mock).mockResolvedValue({
		providers: [
			{
				id: 'openai-codex',
				name: 'OpenAI Codex',
				authentication: 'oauth',
				configured: false,
				models: [{ id: 'gpt-coder', name: 'GPT Coder', reasoning: true, contextWindow: 200000 }],
			},
		],
	});
	(coderApi.connectCodex as jest.Mock).mockResolvedValue({ configured: true, type: 'oauth' });
	(coderApi.cancelCodexLogin as jest.Mock).mockResolvedValue(true);
	(coderApi.disconnectCodex as jest.Mock).mockResolvedValue(undefined);
	(coderApi.listProjects as jest.Mock).mockResolvedValue([project]);
	(coderApi.listSessions as jest.Mock).mockResolvedValue([session]);
	(coderApi.getSession as jest.Mock).mockResolvedValue({
		session,
		blocks: [
			{
				id: 'message-1',
				type: 'message',
				role: 'assistant',
				content: 'Restored response',
				timestamp: '2026-08-20T10:01:00.000Z',
			},
		],
	});
});

it('restores the active project session and starts a new persistent Agent run', async () => {
	const { result } = renderHook(() => useCoderWorkspace());

	await waitFor(() => expect(result.current.loading).toBe(false));
	expect(result.current.activeProjectId).toBe(project.id);
	expect(result.current.activeSessionId).toBe(session.id);
	expect(result.current.blocks).toEqual([
		expect.objectContaining({ content: 'Restored response', status: 'complete' }),
	]);

	act(() => {
		result.current.newSession();
		result.current.setInput('Inspect the project');
	});
	(coderApi.send as jest.Mock).mockImplementation(async (request, onEvent) => {
		onEvent({
			type: 'status',
			runId: 'run-1',
			projectId: project.id,
			sessionId: 'session-2',
			status: 'started',
		});
		onEvent({
			type: 'text-delta',
			runId: 'run-1',
			projectId: project.id,
			sessionId: 'session-2',
			delta: 'Done',
		});
		onEvent({
			type: 'status',
			runId: 'run-1',
			projectId: project.id,
			sessionId: 'session-2',
			status: 'completed',
		});
		return { projectId: request.projectId, sessionId: 'session-2', output: 'Done' };
	});

	await act(async () => result.current.send());

	expect(coderApi.send).toHaveBeenCalledWith(
		{ projectId: project.id, mode: 'agent', input: 'Inspect the project' },
		expect.any(Function)
	);
	expect(result.current.activeSessionId).toBe('session-2');
	expect(result.current.blocks).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ role: 'user', content: 'Inspect the project' }),
			expect.objectContaining({ role: 'assistant', content: 'Done', status: 'complete' }),
		])
	);
});

it('groups sessions by workspace and opens an inactive workspace session', async () => {
	(coderApi.listProjects as jest.Mock).mockResolvedValue([project, otherProject]);
	(coderApi.listSessions as jest.Mock).mockImplementation(async (projectId) =>
		projectId === otherProject.id ? [otherSession] : [session]
	);
	(coderApi.getSession as jest.Mock).mockImplementation(async (projectId, sessionId) => ({
		session: projectId === otherProject.id ? otherSession : session,
		blocks: [
			{
				id: sessionId,
				type: 'message',
				role: 'assistant',
				content: projectId === otherProject.id ? 'Website response' : 'Restored response',
				timestamp: '2026-08-20T10:01:00.000Z',
			},
		],
	}));
	const { result } = renderHook(() => useCoderWorkspace());

	await waitFor(() => expect(result.current.loading).toBe(false));
	expect(result.current.sessionsByProject).toEqual({
		[project.id]: [session],
		[otherProject.id]: [otherSession],
	});

	await act(async () => result.current.selectSession(otherProject.id, otherSession.id));
	expect(result.current.activeProjectId).toBe(otherProject.id);
	expect(result.current.activeSessionId).toBe(otherSession.id);
	expect(result.current.blocks).toEqual([expect.objectContaining({ content: 'Website response' })]);
});

it('loads and saves the extension configuration through the Coder SDK', async () => {
	const { result } = renderHook(() => useConfiguration());

	await waitFor(() => expect(result.current.loading).toBe(false));
	expect(result.current.selectedProvider?.name).toBe('OpenAI Codex');

	act(() => result.current.setTools('read-only'));
	await waitFor(() =>
		expect(coderApi.saveSettings).toHaveBeenCalledWith(
			expect.objectContaining({ toolMode: 'read-only' })
		)
	);
});

it('projects Codex device authentication into the extension configuration', async () => {
	(coderApi.connectCodex as jest.Mock).mockImplementation(async (onEvent) => {
		onEvent({
			type: 'device-code',
			userCode: 'ABCD-EFGH',
			verificationUri: 'https://example.com/device',
		});
		return { configured: true, type: 'oauth' };
	});
	const { result } = renderHook(() => useConfiguration());
	await waitFor(() => expect(result.current.loading).toBe(false));

	await act(async () => result.current.connect());
	expect(result.current.authEvent).toEqual(
		expect.objectContaining({ type: 'device-code', userCode: 'ABCD-EFGH' })
	);
	expect(app.openExternalUrl).toHaveBeenCalledWith('https://example.com/device');
});
