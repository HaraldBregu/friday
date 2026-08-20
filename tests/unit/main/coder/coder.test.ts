jest.mock('../../../../../src/main/coder/location', () => ({
	coderLocation: () => '/tmp/friday-coder-test',
}));

import {
	createAgentSession,
	DefaultResourceLoader,
	modelRuntimeCreate,
} from '@earendil-works/pi-coding-agent';
import { Coder } from '../../../../../src/main/coder/coder';
import type { CoderStore } from '../../../../../src/main/coder/store';

const settings = {
	runtime: 'pi' as const,
	providerId: 'openai' as const,
	modelId: 'gpt-coder',
	thinkingLevel: 'medium' as const,
	toolMode: 'read-only' as const,
	workingDirectory: process.cwd(),
};

beforeEach(() => {
	jest.clearAllMocks();
	DefaultResourceLoader.instances.length = 0;
});

it('runs Pi with the saved model, isolated resources, and redacted stream events', async () => {
	const model = {
		id: 'gpt-coder',
		name: 'GPT Coder',
		reasoning: true,
		contextWindow: 1000,
	};
	const runtime = {
		getModel: jest.fn(() => model),
		checkAuth: jest.fn(async () => ({ type: 'api_key', source: 'Friday' })),
		setRuntimeApiKey: jest.fn(async () => undefined),
		removeRuntimeApiKey: jest.fn(async () => undefined),
	};
	modelRuntimeCreate.mockResolvedValue(runtime);
	let listener: (event: unknown) => void = () => undefined;
	const session = {
		subscribe: jest.fn((nextListener) => {
			listener = nextListener;
			return jest.fn();
		}),
		prompt: jest.fn(async () => {
			listener({
				type: 'message_update',
				assistantMessageEvent: { type: 'text_delta', delta: 'done' },
			});
			listener({
				type: 'tool_execution_start',
				toolCallId: 'tool-1',
				toolName: 'read',
				args: { path: '/secret/path' },
			});
			listener({
				type: 'tool_execution_end',
				toolCallId: 'tool-1',
				toolName: 'read',
				result: { content: 'secret output' },
				isError: false,
			});
		}),
		abort: jest.fn(async () => undefined),
		dispose: jest.fn(),
	};
	(createAgentSession as jest.Mock).mockResolvedValue({ session });
	const coder = new Coder({
		store: { get: jest.fn(() => settings), set: jest.fn() } as unknown as CoderStore,
		getProvider: (id) =>
			id === 'openai'
				? { id, name: 'OpenAI', apiKey: 'key', baseUrl: 'https://api.openai.com/v1' }
				: undefined,
	});
	const events: unknown[] = [];

	await expect(coder.send(4, 'run-1', 'Inspect this project', (event) => events.push(event))).resolves.toBe(
		'done'
	);
	expect(createAgentSession).toHaveBeenCalledWith(
		expect.objectContaining({
			model,
			tools: ['read', 'grep', 'find', 'ls'],
		})
	);
	expect(DefaultResourceLoader.instances[0]?.options).toEqual(
		expect.objectContaining({
			noExtensions: true,
			noSkills: true,
			noPromptTemplates: true,
			noThemes: true,
		})
	);
	expect(events).toContainEqual({ type: 'text-delta', runId: 'run-1', delta: 'done' });
	expect(events).toContainEqual({
		type: 'tool-start',
		runId: 'run-1',
		toolCallId: 'tool-1',
		toolName: 'read',
	});
	expect(JSON.stringify(events)).not.toContain('secret');
});

it('uses Codex device OAuth and projects only the device code event', async () => {
	const runtime = {
		login: jest.fn(async (_provider, _type, interaction) => {
			await expect(
				interaction.prompt({
					type: 'select',
					message: 'Choose login',
					options: [{ id: 'device_code', label: 'Device code' }],
				})
			).resolves.toBe('device_code');
			interaction.notify({
				type: 'device_code',
				userCode: 'ABCD-EFGH',
				verificationUri: 'https://example.com/device',
				expiresInSeconds: 600,
			});
		}),
		checkAuth: jest.fn(async () => ({ type: 'oauth', source: 'OAuth' })),
	};
	modelRuntimeCreate.mockResolvedValue(runtime);
	const coder = new Coder({
		store: { get: jest.fn(() => settings), set: jest.fn() } as unknown as CoderStore,
		getProvider: () => undefined,
	});
	const events: unknown[] = [];

	await expect(coder.connectCodex(4, (event) => events.push(event))).resolves.toEqual({
		configured: true,
		type: 'oauth',
		source: 'OAuth',
	});
	expect(events).toEqual([
		{
			type: 'device-code',
			userCode: 'ABCD-EFGH',
			verificationUri: 'https://example.com/device',
			expiresInSeconds: 600,
		},
	]);
});
