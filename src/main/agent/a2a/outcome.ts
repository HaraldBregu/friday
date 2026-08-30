import { TaskState } from '@a2a-js/sdk';
import { formatA2aTaskOutcome } from './format';

export function a2aTaskOutcome(
	taskId: string,
	contextId: string,
	state: TaskState | undefined,
	text: string
): string {
	const outcome = formatA2aTaskOutcome(taskId, contextId, state, text);
	if (
		state === TaskState.TASK_STATE_FAILED ||
		state === TaskState.TASK_STATE_CANCELED ||
		state === TaskState.TASK_STATE_REJECTED
	) {
		throw new Error(outcome);
	}
	return outcome;
}
