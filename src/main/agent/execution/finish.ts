import type { ToolCall } from '../types';

export function finishToolCalls(calls: readonly ToolCall[], reason: string): void {
	for (const call of calls) {
		call.result ??= { content: `Not executed: ${reason}`, isError: true };
	}
}
