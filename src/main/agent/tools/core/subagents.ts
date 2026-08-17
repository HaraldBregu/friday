import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { KeyedLimiter } from '../../limiter';
import { stream, type StreamOptions } from '../../runner/run_stream';
import { createSessionState } from '../../session';
import type { Config, RuntimeInput, Tool } from '../../types';
import type { AgentRunType } from '../../../../shared/agent_types';
import { tool } from '../tool';

export interface ChildRuntime extends Pick<
	StreamOptions,
	'resources' | 'providerLimiter' | 'subagentLimiter'
> {
	type: AgentRunType;
	interactionMode: import('../../../../shared/agent_types').AgentInteractionMode;
}

export async function runChild(
	config: Config,
	tools: Tool[],
	task: string,
	instructions: string,
	signal: AbortSignal,
	runtime: ChildRuntime
): Promise<string> {
	const baseInput = {
		runId: randomUUID(),
		task: 'subagent',
		message: task,
		agentId: 'subagent',
		contextMode: 'minimal' as const,
		interactionMode: runtime.interactionMode,
		toolsAllow: tools.map((candidate) => candidate.id),
	};
	const input: RuntimeInput =
		runtime.type === 'background'
			? { ...baseInput, type: 'background' }
			: { ...baseInput, type: 'default' };
	const session = createSessionState();
	session.messages = [{ role: 'user', content: task }];

	let text = '';
	const { type: _type, ...streamOptions } = runtime;
	const events = stream(config, session, input, signal, {
		tools,
		instructions,
		...streamOptions,
	});
	for await (const event of events) {
		if (event.type === 'assistant_message') text = event.content;
		if (event.type === 'run_finished' && event.result.subtype === 'error_max_turns') {
			text = text || 'Subagent stopped: reached max iterations without a final answer.';
		}
	}
	return text;
}

const subagentInstructions = `You are a subagent spawned by the main agent to complete one specific task.

Rules:
- Stay focused: do the assigned task, nothing else. No side quests, no proactive actions.
- You are NOT the main agent: no user conversation, and no external messages unless the task explicitly asks for them.
- Some tools may be denied because they require user permission; work around them or report the limitation.

When you finish, your final response is reported back to the main agent. Include what you accomplished or found and any details the main agent needs. Keep it concise but informative.`;

const subagentsInstructions = `You are one of several parallel subagents spawned by the main agent to complete one independent research or inspection task.

Rules:
- Stay focused on the assigned task and return only the findings the main agent needs.
- Treat the available tools as read-only. Do not attempt file changes, commands, schedules, persistence, or external actions.
- You are NOT the main agent: do not converse with the user or spawn more agents.`;

const fallbackPool = new KeyedLimiter(3);
const PARALLEL_TOOL_IDS = new Set(['read', 'search_web', 'fetch_web_page', 'query_knowledge']);

export function subagentTool(
	config: Config,
	tools: Tool[],
	runtime: ChildRuntime
): Tool {
	return tool({
		id: 'subagent',
		name: 'Subagent',
		description:
			'Spawn a subagent to complete a task in its own isolated context and return a summary. It has the same tools as you, except spawning subagents. Use it for work that takes many steps, produces large intermediate output, or is independent of the conversation. Give it a clear objective and the expected output.',
		planSafe: true,
		inputSchema: z.object({
			task: z.string().describe('The task for the subagent to complete'),
		}),
			execute: async ({ task }, signal) => {
			const childTools = tools.filter(
				(candidate) =>
					candidate.id !== 'subagent' &&
					candidate.id !== 'subagents' &&
					candidate.id !== 'ask' &&
					candidate.id !== 'load_skill'
			);
			return runChild(
				config,
				childTools,
				task,
				subagentInstructions,
				signal ?? new AbortController().signal,
				runtime
			);
		},
	});
}

export function subagentsTool(
	config: Config,
	tools: Tool[],
	runtime: ChildRuntime,
	pool: KeyedLimiter = fallbackPool
): Tool {
	return tool({
		id: 'subagents',
		name: 'Subagents',
		description:
			'Spawn two or three independent read-only subagents concurrently. Each task must have a stable id. Results preserve input order, and one failed child does not cancel its siblings.',
		planSafe: true,
		inputSchema: z.object({
			tasks: z
				.array(
					z.object({
						id: z.string().trim().min(1),
						task: z.string().trim().min(1),
					})
				)
				.min(2)
				.max(3),
		}),
		execute: async ({ tasks }, signal) => {
			const parentSignal = signal ?? new AbortController().signal;
			const childTools = tools.filter((candidate) => PARALLEL_TOOL_IDS.has(candidate.id));
			const settled = await Promise.allSettled(
				tasks.map(async ({ task }) => {
					const lease = await pool.acquire('subagents', parentSignal);
					try {
						return await runChild(
							config,
							childTools,
							task,
							subagentsInstructions,
							parentSignal,
							runtime
						);
					} finally {
						lease.release();
					}
				})
			);
			return settled.map((result, index) => ({
				id: tasks[index].id,
				status: result.status,
				text:
					result.status === 'fulfilled'
						? result.value
						: result.reason instanceof Error
							? result.reason.message
							: String(result.reason),
			}));
		},
	});
}
