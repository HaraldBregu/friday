const mockStdio = jest.fn();
jest.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
	getDefaultEnvironment: () => ({ PATH: '/bin' }),
	StdioClientTransport: mockStdio,
}));
import { safeStorage } from 'electron';
import { authorizeMcpLaunch } from '../../../../src/main/mcp/launch/authorize';
import { isMcpLaunchTrusted } from '../../../../src/main/mcp/launch/trusted';
import { revokeMcpLaunch } from '../../../../src/main/mcp/launch/revoke';
import { launchStore, volatileLaunchGrants } from '../../../../src/main/mcp/launch/store';
import { buildTransport } from '../../../../src/main/mcp/mcp_client_build_transport';
import type { McpStdioData } from '../../../../src/shared/mcp_types';

const data: McpStdioData = {
	type: 'stdio',
	command: 'node',
	args: ['server.js'],
	env: { TOKEN: 'fixture' },
	cwd: '/fixture',
	require_approval: 'always',
};

beforeEach(() => {
	jest.clearAllMocks();
	launchStore.set('grants', {});
	volatileLaunchGrants.clear();
	jest.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(true);
	jest.mocked(safeStorage.encryptString).mockImplementation((value) => Buffer.from(value));
	jest.mocked(safeStorage.decryptString).mockImplementation((value) => value.toString());
});

it('blocks untrusted discovered launch definitions before constructing a process transport', () => {
	expect(() => buildTransport('local', data)).toThrow('not trusted');
	expect(mockStdio).not.toHaveBeenCalled();
	expect(() =>
		buildTransport('local', { ...data, launchTrust: 'invented' } as McpStdioData)
	).toThrow('not trusted');
	authorizeMcpLaunch('local', data);
	expect(() => buildTransport('local', data)).not.toThrow();
	expect(mockStdio).toHaveBeenCalledTimes(1);
});

it.each([
	{ command: 'other' },
	{ args: ['other.js'] },
	{ env: { TOKEN: 'changed' } },
	{ cwd: '/other' },
	{ enabled: false },
	{ require_approval: 'never' as const },
])('requires renewed trust after launch or policy settings change: %j', (change) => {
	authorizeMcpLaunch('local', data);
	expect(isMcpLaunchTrusted('local', { ...data, ...change })).toBe(false);
	expect(() => buildTransport('local', { ...data, ...change })).toThrow('not trusted');
});

it('binds grants to server identity and supports explicit revocation', () => {
	authorizeMcpLaunch('local', data);
	launchStore.set('grants', {
		...launchStore.get('grants'),
		other: launchStore.get('grants').local,
	});
	expect(isMcpLaunchTrusted('other', data)).toBe(false);
	revokeMcpLaunch('local');
	expect(isMcpLaunchTrusted('local', data)).toBe(false);
});

it('keeps grants volatile when secure storage is unavailable', () => {
	jest.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false);
	authorizeMcpLaunch('local', data);
	expect(launchStore.get('grants')).toEqual({});
	expect(isMcpLaunchTrusted('local', data)).toBe(true);
	volatileLaunchGrants.clear();
	expect(isMcpLaunchTrusted('local', data)).toBe(false);
});
