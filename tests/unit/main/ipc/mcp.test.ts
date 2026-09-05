const mockAuthorizeMcpLaunch = jest.fn();
jest.mock('../../../../src/main/mcp/launch/authorize', () => ({
	authorizeMcpLaunch: mockAuthorizeMcpLaunch,
}));
const testMcpServer = jest.fn();

jest.mock('../../../../src/main/mcp', () => ({
	configureLocalMcpServer: jest.fn(),
	createOAuthProvider: jest.fn(),
	deleteMcpServer: jest.fn(),
	getMcpOauth: jest.fn(() => ({})),
	getMcpServers: jest.fn(() => ({})),
	importLocalMcpServers: jest.fn(),
	listConfiguredMcpServers: jest.fn(() => ({})),
	listMcpRegistry: jest.fn(() => []),
	mcpLocalRoot: jest.fn(() => '/mcp'),
	saveMcpOauth: jest.fn(),
	setMcpServers: jest.fn(),
	startOauthCallbackServer: jest.fn(),
	testMcpServer,
	upsertMcpServer: jest.fn(),
}));

jest.mock('@modelcontextprotocol/sdk/client/auth.js', () => ({ auth: jest.fn() }));

import { getMcpServers, configureLocalMcpServer } from '../../../../src/main/mcp';
import { BrowserWindow, ipcMain } from 'electron';
import { McpChannels } from '../../../../src/shared/ipc_channels_definitions';
import { McpIpc } from '../../../../src/main/ipc/mcp';

describe('MCP IPC', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('rejects app views before testing a server', async () => {
		const mainFrame = {};
		const mainSender = { id: 21, mainFrame };
		const appFrame = {};
		const appSender = { id: 22, mainFrame: appFrame };
		const window = { id: 1, webContents: mainSender };
		jest
			.mocked(BrowserWindow.fromWebContents)
			.mockImplementation((sender) => (sender === mainSender ? (window as never) : null));
		const windows = { has: (id: number) => id === window.id };
		const apps = { has: (sender: unknown) => sender === appSender };
		new McpIpc().register({ windows, apps } as never, {} as never);

		const handler = jest
			.mocked(ipcMain.handle)
			.mock.calls.find(([channel]) => channel === McpChannels.test)?.[1] as (
			event: unknown,
			id: string
		) => Promise<{ success: boolean }>;

		await expect(
			handler({ sender: appSender, senderFrame: appFrame } as never, 'unsafe')
		).resolves.toMatchObject({ success: false });
		expect(testMcpServer).not.toHaveBeenCalled();
		expect(mockAuthorizeMcpLaunch).not.toHaveBeenCalled();

		await expect(
			handler({ sender: mainSender, senderFrame: mainFrame } as never, 'safe')
		).resolves.toMatchObject({ success: true });
		expect(testMcpServer).toHaveBeenCalledWith('safe');
	});
});

it.each([
	[McpChannels.save, [{ local: { type: 'stdio', command: 'node', args: ['server.js'] } }]],
	[McpChannels.upsert, ['local', { type: 'stdio', command: 'node', args: ['server.js'] }]],
	[McpChannels.configureLocal, ['local', { type: 'stdio', command: 'node', args: ['server.js'] }]],
	[McpChannels.test, ['local']],
])('mints launch trust only after an owner action on %s', async (channel, args) => {
	jest.clearAllMocks();
	const data = { type: 'stdio' as const, command: 'node', args: ['server.js'] };
	jest.mocked(getMcpServers).mockReturnValue({ local: data });
	jest.mocked(configureLocalMcpServer).mockReturnValue({ id: 'local', source: 'local', data });
	const mainFrame = {};
	const sender = { id: 31, mainFrame };
	const appFrame = {};
	const appSender = { id: 32, mainFrame: appFrame };
	const window = { id: 1, webContents: sender };
	jest
		.mocked(BrowserWindow.fromWebContents)
		.mockImplementation((candidate) => (candidate === sender ? (window as never) : null));
	new McpIpc().register(
		{
			windows: { has: (id: number) => id === 1 },
			apps: { has: (candidate: unknown) => candidate === appSender },
		} as never,
		{} as never
	);
	const handler = jest.mocked(ipcMain.handle).mock.calls.find(([name]) => name === channel)![1] as (
		...args: unknown[]
	) => Promise<unknown>;
	await handler({ sender: appSender, senderFrame: appFrame }, ...args);
	expect(mockAuthorizeMcpLaunch).not.toHaveBeenCalled();
	await handler({ sender, senderFrame: mainFrame }, ...args);
	expect(mockAuthorizeMcpLaunch).toHaveBeenCalledTimes(1);
	expect(mockAuthorizeMcpLaunch).toHaveBeenCalledWith('local', data);
});
