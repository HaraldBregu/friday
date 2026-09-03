import { callTool } from '../../../../src/main/mcp/mcp_client_call_tool';
import type { McpClient } from '../../../../src/main/mcp/mcp_types';

describe('MCP client tool call', () => {
	it('passes timeout and cancellation through to the SDK request', async () => {
		const sdkCall = jest.fn().mockResolvedValue({ content: [] });
		const client = { callTool: sdkCall } as unknown as McpClient;
		const signal = new AbortController().signal;

		await callTool(client, 'lookup', { query: 'Kucedr' }, 1_500, signal);

		expect(sdkCall).toHaveBeenCalledWith(
			{ name: 'lookup', arguments: { query: 'Kucedr' } },
			undefined,
			{ timeout: 1_500, signal }
		);
	});
});
