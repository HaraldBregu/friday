import { selectOriginTools } from '../../../../../src/main/agent/runner/run_origin_tools';
import { jsonTool } from '../../../../../src/main/agent/tools/tool';
import type { AgentOrigin } from '../../../../../src/shared/agent_types';

function namedTool(name: string, allowedOrigins?: AgentOrigin[]) {
	return jsonTool({
		name,
		description: name,
		allowedOrigins,
		schema: { type: 'object' },
		execute: () => undefined,
	});
}

const tools = [
	namedTool('read', ['main', 'task', 'subagent']),
	namedTool('write'),
	namedTool('patch'),
	namedTool('web_search', ['main', 'bot', 'task', 'subagent']),
	namedTool('web_fetch', ['main', 'bot', 'task', 'subagent']),
	namedTool('bot_write', ['bot']),
	namedTool('exec', ['main', 'task', 'subagent']),
	namedTool('memory_list', ['main']),
	namedTool('subagent', ['main']),
	namedTool('subagents', ['main']),
];

it('gives bots only explicitly bot-allowed tools and never elevates through toolsAllow', () => {
	expect(selectOriginTools(tools, 'bot').map((tool) => tool.name)).toEqual([
		'web_search',
		'web_fetch',
		'bot_write',
	]);
	expect(selectOriginTools(tools, 'bot', ['exec', 'memory_list'])).toEqual([]);
	expect(selectOriginTools(tools, 'bot', ['write'])).toEqual([]);
	expect(selectOriginTools(tools, 'bot', ['bot_write']).map((tool) => tool.name)).toEqual([
		'bot_write',
	]);
	expect(
		selectOriginTools(tools, 'bot', undefined, ['web_fetch']).map((tool) => tool.name)
	).toEqual(['web_search', 'bot_write']);
});

it('gives tasks all compatible tools by default and keeps a non-empty allowlist as a filter', () => {
	expect(selectOriginTools(tools, 'health')).toEqual([]);
	expect(selectOriginTools(tools, 'task').map((tool) => tool.name)).toEqual([
		'read',
		'write',
		'patch',
		'web_search',
		'web_fetch',
		'exec',
	]);
	expect(selectOriginTools(tools, 'task', []).map((tool) => tool.name)).toEqual([
		'read',
		'write',
		'patch',
		'web_search',
		'web_fetch',
		'exec',
	]);
	expect(selectOriginTools(tools, 'task', ['exec']).map((tool) => tool.name)).toEqual(['exec']);
});

it('maps legacy recorder capability names to current runtime tools', () => {
	const recorder = namedTool('camera_recorder', ['main', 'task']);
	expect(selectOriginTools([recorder], 'task', ['recorder_camera'])).toEqual([recorder]);
	expect(selectOriginTools([recorder], 'task', undefined, ['recorder_camera'])).toEqual([]);
});

it('prevents nested subagents and respects per-tool origin restrictions', () => {
	expect(selectOriginTools(tools, 'subagent').map((tool) => tool.name)).toEqual([
		'read',
		'write',
		'patch',
		'web_search',
		'web_fetch',
		'exec',
	]);
});
