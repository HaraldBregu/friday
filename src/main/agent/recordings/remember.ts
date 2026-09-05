import type { Recorder } from '../../recorder';
import type { ExecutionScope } from '../execution/scope';
import { recordingOwners } from './store';

export function rememberRecording(recorder: Recorder, id: string, scope: ExecutionScope): void {
	const owners = recordingOwners.get(recorder) ?? new Map<string, ExecutionScope>();
	owners.set(id, scope);
	recordingOwners.set(recorder, owners);
}
